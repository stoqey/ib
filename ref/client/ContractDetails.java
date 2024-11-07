/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.util.List;

import com.ib.client.Types.FundAssetType;
import com.ib.client.Types.FundDistributionPolicyIndicator;
import com.ib.client.Types.SecType;

public class ContractDetails {
    private Contract m_contract;
    private String   m_marketName;
    private double   m_minTick;
    private int      m_priceMagnifier;
    private String   m_orderTypes;
    private String   m_validExchanges;
    private int      m_underConid;
    private String   m_longName;
    private String   m_contractMonth;
    private String   m_industry;
    private String   m_category;
    private String   m_subcategory;
    private String   m_timeZoneId;
    private String   m_tradingHours;
    private String   m_liquidHours;
    private String   m_evRule;
    private double   m_evMultiplier;
    private List<TagValue> m_secIdList; // CUSIP/ISIN/etc.
    private int      m_aggGroup;
    private String   m_underSymbol;
    private String   m_underSecType;
    private String   m_marketRuleIds;
    private String   m_realExpirationDate;
    private String   m_lastTradeTime;
    private String   m_stockType; // COMMON, ETF, ADR etc.
    private Decimal  m_minSize;
    private Decimal  m_sizeIncrement;
    private Decimal  m_suggestedSizeIncrement;

    // BOND values
    private String   m_cusip;
    private String   m_ratings;
    private String   m_descAppend;
    private String   m_bondType;
    private String   m_couponType;
    private boolean  m_callable = false;
    private boolean  m_putable = false;
    private double   m_coupon = 0;
    private boolean  m_convertible = false;
    private String   m_maturity;
    private String   m_issueDate;
    private String   m_nextOptionDate;
    private String   m_nextOptionType;
    private boolean  m_nextOptionPartial = false;
    private String   m_notes;
    
    // FUND values
    private String   m_fundName;
    private String   m_fundFamily;
    private String   m_fundType;
    private String   m_fundFrontLoad;
    private String   m_fundBackLoad;
    private String   m_fundBackLoadTimeInterval;
    private String   m_fundManagementFee;
    private boolean  m_fundClosed = false;
    private boolean  m_fundClosedForNewInvestors = false;
    private boolean  m_fundClosedForNewMoney = false;
    private String   m_fundNotifyAmount;
    private String   m_fundMinimumInitialPurchase;
    private String   m_fundSubsequentMinimumPurchase;
    private String   m_fundBlueSkyStates;
    private String   m_fundBlueSkyTerritories;
    private FundDistributionPolicyIndicator m_fundDistributionPolicyIndicator;
    private FundAssetType m_fundAssetType;
    private List<IneligibilityReason> m_ineligibilityReasonList;

    // Get
    public int conid()                  { return m_contract.conid(); }
    public Contract contract()          { return m_contract; }
    public String marketName()          { return m_marketName; }
    public double minTick()             { return m_minTick; }
    public int priceMagnifier()         { return m_priceMagnifier; }
    public String orderTypes()          { return m_orderTypes; }
    public String validExchanges()      { return m_validExchanges; }
    public int underConid()             { return m_underConid; }
    public String longName()            { return m_longName; }
    public String contractMonth()       { return m_contractMonth; }
    public String industry()            { return m_industry; }
    public String category()            { return m_category; }
    public String subcategory()         { return m_subcategory; }
    public String timeZoneId()          { return m_timeZoneId; }
    public String tradingHours()        { return m_tradingHours; }
    public String liquidHours()         { return m_liquidHours; }
    public String evRule()              { return m_evRule; }
    public double evMultiplier()        { return m_evMultiplier; }
    public List<TagValue> secIdList()   { return m_secIdList; }
    public int aggGroup()               { return m_aggGroup; }
    public String underSymbol()         { return m_underSymbol; }
    public String underSecType()        { return m_underSecType; }
    public String marketRuleIds()       { return m_marketRuleIds; }
    public String realExpirationDate()  { return m_realExpirationDate; }
    public String lastTradeTime()       { return m_lastTradeTime; }
    public String stockType()           { return m_stockType; }
    public Decimal minSize()            { return m_minSize; }
    public Decimal sizeIncrement()      { return m_sizeIncrement; }
    public Decimal suggestedSizeIncrement() { return m_suggestedSizeIncrement; }
    
    public String cusip()               { return m_cusip; }
    public String ratings()             { return m_ratings; }
    public String descAppend()          { return m_descAppend; }
    public String bondType()            { return m_bondType; }
    public String couponType()          { return m_couponType; }
    public boolean callable()           { return m_callable; }
    public boolean putable()            { return m_putable; }
    public double coupon()              { return m_coupon; }
    public boolean convertible()        { return m_convertible; }
    public String maturity()            { return m_maturity; }
    public String issueDate()           { return m_issueDate; }
    public String nextOptionDate()      { return m_nextOptionDate; }
    public String nextOptionType()      { return m_nextOptionType; }
    public boolean nextOptionPartial()  { return m_nextOptionPartial; }
    public String notes()               { return m_notes; }

    public String fundName()                      { return m_fundName; }
    public String fundFamily()                    { return m_fundFamily; }
    public String fundType()                      { return m_fundType; }
    public String fundFrontLoad()                 { return m_fundFrontLoad; }
    public String fundBackLoad()                  { return m_fundBackLoad; }
    public String fundBackLoadTimeInterval()      { return m_fundBackLoadTimeInterval; }
    public String fundManagementFee()             { return m_fundManagementFee; }
    public boolean fundClosed()                   { return m_fundClosed; }
    public boolean fundClosedForNewInvestors()    { return m_fundClosedForNewInvestors; }
    public boolean fundClosedForNewMoney()        { return m_fundClosedForNewMoney; }
    public String fundNotifyAmount()              { return m_fundNotifyAmount; }
    public String fundMinimumInitialPurchase()    { return m_fundMinimumInitialPurchase; }
    public String fundSubsequentMinimumPurchase() { return m_fundSubsequentMinimumPurchase; }
    public String fundBlueSkyStates()             { return m_fundBlueSkyStates; }
    public String fundBlueSkyTerritories()        { return m_fundBlueSkyTerritories; }
    public FundDistributionPolicyIndicator fundDistributionPolicyIndicator() { return m_fundDistributionPolicyIndicator; }
    public FundAssetType fundAssetType()          { return m_fundAssetType; }
    public List<IneligibilityReason> ineligibilityReasonList() { return m_ineligibilityReasonList; }
    
    // Set
    public void contract(Contract contract)         { m_contract = contract; }
    public void marketName(String marketName)       { m_marketName = marketName; }
    public void minTick(double minTick)             { m_minTick = minTick; }
    public void priceMagnifier(int priceMagnifier)  { m_priceMagnifier = priceMagnifier; }
    public void orderTypes(String orderTypes)       { m_orderTypes = orderTypes; }
    public void validExchanges(String validExchanges) { m_validExchanges = validExchanges; }
    public void underConid(int underConid)          { m_underConid = underConid; }
    public void longName(String longName)           { m_longName = longName; }
    public void contractMonth(String contractMonth) { m_contractMonth = contractMonth; }
    public void industry(String industry)           { m_industry = industry; }
    public void category(String category)           { m_category = category; }
    public void subcategory(String subcategory)     { m_subcategory = subcategory; }    
    public void timeZoneId(String timeZoneId)       { m_timeZoneId = timeZoneId; }
    public void tradingHours(String tradingHours)   { m_tradingHours = tradingHours; }
    public void liquidHours(String liquidHours)     { m_liquidHours = liquidHours; }
    public void evRule(String evRule)               { m_evRule = evRule; }
    public void evMultiplier(double evMultiplier)   { m_evMultiplier = evMultiplier; }
    public void secIdList(List<TagValue> secIdList) { m_secIdList = secIdList; }
    public void aggGroup(int aggGroup)              { m_aggGroup = aggGroup; }
    public void underSymbol(String underSymbol)     { m_underSymbol = underSymbol; }
    public void underSecType(String underSecType)   { m_underSecType = underSecType; }
    public void marketRuleIds(String marketRuleIds) { m_marketRuleIds = marketRuleIds; }
    public void realExpirationDate(String realExpirationDate) { m_realExpirationDate = realExpirationDate; }
    public void  lastTradeTime(String lastTradeTime) { m_lastTradeTime = lastTradeTime; }
    public void stockType(String stockType)         { m_stockType = stockType; }
    public void minSize(Decimal minSize)            { m_minSize = minSize; }
    public void sizeIncrement(Decimal sizeIncrement) { m_sizeIncrement = sizeIncrement; }
    public void suggestedSizeIncrement(Decimal suggestedSizeIncrement) { m_suggestedSizeIncrement = suggestedSizeIncrement; }
    
    public void cusip(String cusip)             { m_cusip = cusip; }
    public void ratings(String ratings)         { m_ratings = ratings; }
    public void descAppend(String descAppend)   { m_descAppend = descAppend; }
    public void bondType(String bondType)       { m_bondType = bondType; }
    public void couponType(String couponType)   { m_couponType = couponType; }
    public void callable(boolean callable)      { m_callable = callable; }
    public void putable(boolean putable)        { m_putable = putable; }
    public void coupon(double coupon)           { m_coupon = coupon; }
    public void convertible(boolean convertible) { m_convertible = convertible; }
    public void maturity(String maturity)       { m_maturity = maturity; }
    public void issueDate(String issueDate)     { m_issueDate = issueDate; }
    public void nextOptionDate(String nextOptionDate) { m_nextOptionDate = nextOptionDate; }    
    public void nextOptionType(String nextOptionType) { m_nextOptionType = nextOptionType; }
    public void nextOptionPartial(boolean nextOptionPartial) { m_nextOptionPartial = nextOptionPartial; }
    public void notes(String notes)             { m_notes = notes; }

    public void fundName(String fundName)                                     { m_fundName = fundName; }
    public void fundFamily(String fundFamily)                                 { m_fundFamily = fundFamily; }
    public void fundType(String fundType)                                     { m_fundType = fundType; }
    public void fundFrontLoad(String fundFrontLoad)                           { m_fundFrontLoad = fundFrontLoad; }
    public void fundBackLoad(String fundBackLoad)                             { m_fundBackLoad = fundBackLoad; }
    public void fundBackLoadTimeInterval(String fundBackLoadTimeInterval)     { m_fundBackLoadTimeInterval = fundBackLoadTimeInterval; }
    public void fundManagementFee(String fundManagementFee)                   { m_fundManagementFee = fundManagementFee; }
    public void fundClosed(boolean fundClosed)                                { m_fundClosed = fundClosed; }
    public void fundClosedForNewInvestors(boolean fundClosedForNewInvestors)  { m_fundClosedForNewInvestors = fundClosedForNewInvestors; }
    public void fundClosedForNewMoney(boolean fundClosedForNewMoney)          { m_fundClosedForNewMoney = fundClosedForNewMoney; }
    public void fundNotifyAmount(String fundNotifyAmount)                     { m_fundNotifyAmount = fundNotifyAmount; }
    public void fundMinimumInitialPurchase(String fundMinimumInitialPurchase) { m_fundMinimumInitialPurchase = fundMinimumInitialPurchase; }
    public void fundSubsequentMinimumPurchase(String fundSubsequentMinimumPurchase) { m_fundSubsequentMinimumPurchase = fundSubsequentMinimumPurchase; }
    public void fundBlueSkyStates(String fundBlueSkyStates)                   { m_fundBlueSkyStates = fundBlueSkyStates; }
    public void fundBlueSkyTerritories(String fundBlueSkyTerritories)         { m_fundBlueSkyTerritories = fundBlueSkyTerritories; }
    public void fundDistributionPolicyIndicator(FundDistributionPolicyIndicator fundDistributionPolicyIndicator) { m_fundDistributionPolicyIndicator = fundDistributionPolicyIndicator; }
    public void fundAssetType(FundAssetType fundAssetType)                    { m_fundAssetType = fundAssetType; }
    public void ineligibilityReasonList(List<IneligibilityReason> ineligibilityReasonList) { m_ineligibilityReasonList = ineligibilityReasonList; }
    
    public ContractDetails() {
        m_contract = new Contract();
        m_minTick = 0;
        m_underConid = 0;
        m_evMultiplier = 0;
    }

    @Override public String toString() {
        StringBuilder sb = new StringBuilder( m_contract.toString() );

        add( sb, "marketName", m_marketName);
        add( sb, "minTick", m_minTick);
        add( sb, "priceMagnifier", m_priceMagnifier);
        add( sb, "orderTypes", m_orderTypes);
        add( sb, "validExchanges", m_validExchanges);
        add( sb, "underConId", m_underConid);
        add( sb, "longName", m_longName);
        add( sb, "contractMonth", m_contractMonth);
        add( sb, "industry", m_industry);
        add( sb, "category", m_category);
        add( sb, "subcategory", m_subcategory);
        add( sb, "timeZoneId", m_timeZoneId);
        add( sb, "tradingHours", m_tradingHours);
        add( sb, "liquidHours", m_liquidHours);
        add( sb, "evRule", m_evRule);
        add( sb, "evMultiplier", m_evMultiplier);
        add( sb, "aggGroup", m_aggGroup);
        add( sb, "underSymbol", m_underSymbol);
        add( sb, "underSecType", m_underSecType);
        add( sb, "marketRuleIds", m_marketRuleIds);
        add( sb, "realExpirationDate", m_realExpirationDate);
        add( sb, "lastTradeTime", m_lastTradeTime);
        add( sb, "stockType", m_stockType);
        add( sb, "minSize", m_minSize);
        add( sb, "sizeIncrement", m_sizeIncrement);
        add( sb, "suggestedSizeIncrement", m_suggestedSizeIncrement);

        add( sb, "cusip", m_cusip);
        add( sb, "ratings", m_ratings);
        add( sb, "descAppend", m_descAppend);
        add( sb, "bondType", m_bondType);
        add( sb, "couponType", m_couponType);
        add( sb, "callable", m_callable);
        add( sb, "putable", m_putable);
        add( sb, "coupon", m_coupon);
        add( sb, "convertible", m_convertible);
        add( sb, "maturity", m_maturity);
        add( sb, "issueDate", m_issueDate);
        add( sb, "nextOptionDate", m_nextOptionDate);
        add( sb, "nextOptionType", m_nextOptionType);
        add( sb, "nextOptionPartial", m_nextOptionPartial);
        add( sb, "notes", m_notes);

        if (m_contract.secType() == SecType.FUND) {
            add( sb, "fundName", m_fundName);
            add( sb, "fundFamily", m_fundFamily);
            add( sb, "fundType", m_fundType);
            add( sb, "fundFrontLoad", m_fundFrontLoad);
            add( sb, "fundBackLoad", m_fundBackLoad);
            add( sb, "fundBackLoadTimeInterval", m_fundBackLoadTimeInterval);
            add( sb, "fundManagementFee", m_fundManagementFee);
            add( sb, "fundClosed", m_fundClosed);
            add( sb, "fundClosedForNewInvestors", m_fundClosedForNewInvestors);
            add( sb, "fundClosedForNewMoney", m_fundClosedForNewMoney);
            add( sb, "fundNotifyAmount", m_fundNotifyAmount);
            add( sb, "fundMinimumInitialPurchase", m_fundMinimumInitialPurchase);
            add( sb, "fundSubsequentMinimumPurchase", m_fundSubsequentMinimumPurchase);
            add( sb, "fundBlueSkyStates", m_fundBlueSkyStates);
            add( sb, "fundBlueSkyTerritories", m_fundBlueSkyTerritories);
            add( sb, "fundDistributionPolicyIndicator", m_fundDistributionPolicyIndicator != null ? m_fundDistributionPolicyIndicator.name() : "");
            add( sb, "fundAssetType", m_fundAssetType != null ? m_fundAssetType.name() : "");
        }

        add( sb, "ineligibilityReasonList", EWrapperMsgGenerator.contractDetailsIneligibilityReasonList(this));

        return sb.toString();
    }

    public static void add(StringBuilder sb, String tag, Object val) {
        if (val == null || val instanceof String && ((String)val).length() == 0) {
            return;
        }
        sb.append( tag);
        sb.append( '\t');
        sb.append( val);
        sb.append( '\n');
    }
}
