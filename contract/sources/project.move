module invoice_addr::decentralized_invoicing {
    use std::signer;
    use std::string::{String};
    use std::option::{Self, Option};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;
    use aptos_std::math64;
    use std::vector;

   

    /// The module has not been initialized.
    const E_NOT_INITIALIZED: u64 = 1;
    /// The signer is not the designated admin of the platform.
    const E_NOT_ADMIN: u64 = 2;
    /// The specified invoice ID does not exist.
    const E_INVOICE_NOT_FOUND: u64 = 3;
    /// The operation is not allowed because the signer is not the owner of the invoice.
    const E_NOT_OWNER: u64 = 4;
    /// The provided payment amount is insufficient.
    const E_INSUFFICIENT_PAYMENT: u64 = 5;
    /// The invoice is not in the correct state for this operation.
    const E_INVALID_INVOICE_STATUS: u64 = 6;
    /// The invoice's due date has not yet passed.
    const E_DUE_DATE_NOT_PASSED: u64 = 7;
    /// A value provided (e.g., percentage) is invalid.
    const E_INVALID_VALUE: u64 = 8;

    const STATUS_CREATED: u8 = 0;
    const STATUS_LISTED: u8 = 1;
    const STATUS_SOLD: u8 = 2;
    const STATUS_SETTLED: u8 = 3;
    const STATUS_DEFAULTED: u8 = 4;


    /// Represents a single invoice on the platform.
    struct Invoice has store, drop, copy {
        invoice_id: u64,
        sme_address: address,
        investor_address: Option<address>,
        client_name: String,
        industry: String,
        invoice_amount: u64,
        list_price: u64,
        due_date_secs: u64,
        status: u8,
    }

    /// Stores all platform-wide configuration and state. Stored as a resource under the admin's account.
    struct PlatformData has key {
        admin: address,
        invoices: Table<u64, Invoice>,
        stakes: Table<u64, Coin<AptosCoin>>,
        pool_funds: Coin<AptosCoin>,
        collected_fees: Coin<AptosCoin>,
        next_invoice_id: u64,
        // All ratios are in basis points (1% = 100)
        stake_ratio_bps: u64,       // SME stake requirement
        pool_contribution_bps: u64, // Community pool contribution
        investor_profit_bps: u64,   // Profit for investor on successful settlement
    }

    
    /// Initializes the platform. This must be called once by the deployer, who becomes the admin.
    fun init_module(sender: &signer) {
        let admin_addr = signer::address_of(sender);
        move_to(sender, PlatformData {
            admin: admin_addr,
            invoices: table::new(),
            stakes: table::new(),
            pool_funds: coin::zero(),
            collected_fees: coin::zero(),
            next_invoice_id: 0,
            stake_ratio_bps: 4000, // 40%
            pool_contribution_bps: 400, // 4%
            investor_profit_bps: 1500, // 15%
        });
    }


    /// Creates a new invoice. The invoice is owned by the SME and initially has 'Created' status.
    public entry fun create_invoice(
        sme: &signer,
        invoice_amount: u64,
        due_date_secs: u64,
        client_name: String,
        industry: String,
    ) acquires PlatformData {
        let sme_addr = signer::address_of(sme);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());
        
        let invoice_id = platform_data.next_invoice_id;
        platform_data.next_invoice_id = invoice_id + 1;

        let new_invoice = Invoice {
            invoice_id,
            sme_address: sme_addr,
            investor_address: option::none(),
            client_name,
            industry,
            invoice_amount,
            list_price: 0, // Not listed yet
            due_date_secs,
            status: STATUS_CREATED,
        };

        table::add(&mut platform_data.invoices, invoice_id, new_invoice);
    }

    /// Lists a created invoice for sale to investors at a specified price.
    public entry fun list_invoice(sme: &signer, invoice_id: u64, price: u64) acquires PlatformData {
        let sme_addr = signer::address_of(sme);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());
        
        assert!(table::contains(&platform_data.invoices, invoice_id), E_INVOICE_NOT_FOUND);
        let invoice = table::borrow_mut(&mut platform_data.invoices, invoice_id);

        assert!(invoice.sme_address == sme_addr, E_NOT_OWNER);
        assert!(invoice.status == STATUS_CREATED, E_INVALID_INVOICE_STATUS);

        invoice.list_price = price;
        invoice.status = STATUS_LISTED;
    }

    public entry fun buy_invoice(
        investor: &signer, 
        invoice_id: u64, 
        // The frontend will pass the expected list price as this argument.
        amount_to_pay: u64
    ) acquires PlatformData {
        let investor_addr = signer::address_of(investor);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());

        assert!(table::contains(&platform_data.invoices, invoice_id), E_INVOICE_NOT_FOUND);
        let invoice = table::borrow_mut(&mut platform_data.invoices, invoice_id);

        assert!(invoice.status == STATUS_LISTED, E_INVALID_INVOICE_STATUS);
        // Assert that the amount being paid matches the current list price.
        assert!(amount_to_pay == invoice.list_price, E_INSUFFICIENT_PAYMENT);
        
        let payment = coin::withdraw<AptosCoin>(investor, amount_to_pay);
        
        // --- The rest of the function logic is the same as the original ---
        
        // Calculate amounts based on list price
        let stake_amount = math64::mul_div(invoice.list_price, platform_data.stake_ratio_bps, 10000);
        let pool_contribution = math64::mul_div(invoice.list_price, platform_data.pool_contribution_bps, 10000);
        
        // Distribute funds
        let stake_coin = coin::extract(&mut payment, stake_amount);
        let pool_coin = coin::extract(&mut payment, pool_contribution);

        // The remainder of the payment goes to the SME
        coin::deposit(invoice.sme_address, payment);
        
        // Lock the SME's stake
        table::add(&mut platform_data.stakes, invoice_id, stake_coin);

        // Add contribution to the community pool
        coin::merge(&mut platform_data.pool_funds, pool_coin);

        // Update invoice state
        invoice.investor_address = option::some(investor_addr);
        invoice.status = STATUS_SOLD;
    }

    public entry fun settle_invoice(
        payer: &signer, 
        invoice_id: u64,
        // The frontend will pass the full invoice amount as this argument.
        amount_to_pay: u64
    ) acquires PlatformData {
        let platform_data = borrow_global_mut<PlatformData>(get_admin());

        assert!(table::contains(&platform_data.invoices, invoice_id), E_INVOICE_NOT_FOUND);
        let invoice = table::borrow_mut(&mut platform_data.invoices, invoice_id);

        assert!(invoice.status == STATUS_SOLD, E_INVALID_INVOICE_STATUS);
        // Assert that the payment covers the full invoice amount.
        assert!(amount_to_pay == invoice.invoice_amount, E_INSUFFICIENT_PAYMENT);

        // --- NEW ---
        // Withdraw the settlement payment from the payer's wallet.
        let payment = coin::withdraw<AptosCoin>(payer, amount_to_pay);

        // --- The rest of the function logic is the same as the original ---

        // 1. Return stake to SME
        let stake_coin = table::remove(&mut platform_data.stakes, invoice_id);
        coin::deposit(invoice.sme_address, stake_coin);

        // 2. Pay investor principal + profit
        let investor_profit = math64::mul_div(invoice.list_price, platform_data.investor_profit_bps, 10000);
        let investor_payout_amount = invoice.list_price + investor_profit;
        
        let investor_payout_coin = coin::extract(&mut payment, investor_payout_amount);
        let investor_addr = *option::borrow(&invoice.investor_address);
        coin::deposit(investor_addr, investor_payout_coin);

        // 3. The rest of the payment is the platform fee
        coin::merge(&mut platform_data.collected_fees, payment);

        // 4. Update invoice status
        invoice.status = STATUS_SETTLED;
    }

    /// Handles the case where the client fails to pay by the due date.
    /// The investor is refunded from the SME's locked stake, and the SME forfeits the stake.
    public entry fun handle_default(investor: &signer, invoice_id: u64) acquires PlatformData {
        let investor_addr = signer::address_of(investor);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());

        assert!(table::contains(&platform_data.invoices, invoice_id), E_INVOICE_NOT_FOUND);
        let invoice = table::borrow_mut(&mut platform_data.invoices, invoice_id);
        
        assert!(option::is_some(&invoice.investor_address) && *option::borrow(&invoice.investor_address) == investor_addr, E_NOT_OWNER);
        assert!(invoice.status == STATUS_SOLD, E_INVALID_INVOICE_STATUS);
        assert!(timestamp::now_seconds() > invoice.due_date_secs, E_DUE_DATE_NOT_PASSED);

        // Pay investor from the SME's stake (which acts as insurance)
        let stake_coin = table::remove(&mut platform_data.stakes, invoice_id);
        coin::deposit(investor_addr, stake_coin);

        // Update status to Defaulted. SME loses their stake.
        invoice.status = STATUS_DEFAULTED;
    }


    /// Allows the admin to compensate an investor from the community pool in exceptional cases (e.g., fraud).
    public entry fun compensate_from_pool(admin: &signer, investor_addr: address, amount: u64) acquires PlatformData {
        assert_is_admin(admin);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());
        
        let payout_coin = coin::extract(&mut platform_data.pool_funds, amount);
        coin::deposit(investor_addr, payout_coin);
    }
    
    /// Allows the admin to collect accumulated platform fees.
    public entry fun collect_fees(admin: &signer) acquires PlatformData {
        assert_is_admin(admin);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());
        let amount = coin::value(&platform_data.collected_fees);
        if (amount > 0) {
            let fees = coin::extract(&mut platform_data.collected_fees, amount);
            coin::deposit(platform_data.admin, fees);
        }
    }

    /// Updates the stake ratio required from SMEs. Value in basis points (e.g., 4000 for 40%).
    public entry fun update_stake_ratio(admin: &signer, new_ratio_bps: u64) acquires PlatformData {
        assert_is_admin(admin);
        assert!(new_ratio_bps <= 10000, E_INVALID_VALUE); // Cannot be more than 100%
        let platform_data = borrow_global_mut<PlatformData>(get_admin());
        platform_data.stake_ratio_bps = new_ratio_bps;
    }

    /// Updates the pool contribution percentage. Value in basis points (e.g., 400 for 4%).
    public entry fun update_pool_contribution(admin: &signer, new_percent_bps: u64) acquires PlatformData {
        assert_is_admin(admin);
        assert!(new_percent_bps <= 10000, E_INVALID_VALUE);
        let platform_data = borrow_global_mut<PlatformData>(get_admin());
        platform_data.pool_contribution_bps = new_percent_bps;
    }

    
    #[view]
    public fun get_invoice(invoice_id: u64): Invoice acquires PlatformData {
        let platform_data = borrow_global<PlatformData>(get_admin());
        assert!(table::contains(&platform_data.invoices, invoice_id), E_INVOICE_NOT_FOUND);
        *table::borrow(&platform_data.invoices, invoice_id)
    }
    
    #[view]
    public fun get_pool_balance(): u64 acquires PlatformData {
        coin::value(&borrow_global<PlatformData>(get_admin()).pool_funds)
    }

    #[view]
    public fun get_collected_fees(): u64 acquires PlatformData {
        coin::value(&borrow_global<PlatformData>(get_admin()).collected_fees)
    }
    #[view]
    public fun get_invoice_count(): u64 acquires PlatformData {
        let platform_data = borrow_global<PlatformData>(get_admin());
        vector::length(&platform_data.invoices)
    }
    
    /// Returns the admin address where PlatformData is stored. For now, this is the module publisher's address.
    fun get_admin(): address {
        @invoice_addr
    }

    /// Asserts that the signer is the platform admin.
    fun assert_is_admin(admin_signer: &signer) acquires PlatformData {
        let signer_addr = signer::address_of(admin_signer);
        let platform_data = borrow_global<PlatformData>(get_admin());
        assert!(signer_addr == platform_data.admin, E_NOT_ADMIN);
    }
}