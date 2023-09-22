/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.io.IOException;
import java.util.ArrayList;

public class EOrderDecoder {

    private final EDecoder m_eDecoder;

    private final Contract m_contract;
    private final Order m_order;
    private final OrderState m_orderState;
    private final int m_version;
    private final int m_serverVersion;

    EOrderDecoder(EDecoder eDecoder, Contract contract, Order order, OrderState orderState, int version, int serverVersion) {
        m_eDecoder = eDecoder;
        m_contract = contract;
        m_order = order;
        m_orderState = orderState;
        m_version = version;
        m_serverVersion = serverVersion;
    }

    public void readOrderId() throws IOException {
        m_order.orderId(m_eDecoder.readInt());
    }
    
    public void readContractFields() throws IOException {
        if ( m_version >= 17) {
            m_contract.conid(m_eDecoder.readInt());
        }
        m_contract.symbol(m_eDecoder.readStr());
        m_contract.secType(m_eDecoder.readStr());
        m_contract.lastTradeDateOrContractMonth(m_eDecoder.readStr());
        m_contract.strike(m_eDecoder.readDouble());
        m_contract.right(m_eDecoder.readStr());
        if ( m_version >= 32) {
            m_contract.multiplier(m_eDecoder.readStr());
        }
        m_contract.exchange(m_eDecoder.readStr());
        m_contract.currency(m_eDecoder.readStr());
        if ( m_version >= 2 ) {
            m_contract.localSymbol(m_eDecoder.readStr());
        }
        if ( m_version >= 32) {
            m_contract.tradingClass(m_eDecoder.readStr());
        }
    }

    public void readAction() throws IOException {
        m_order.action(m_eDecoder.readStr());
    }

    public void readTotalQuantity() throws IOException {
        m_order.totalQuantity(m_eDecoder.readDecimal());
    }

    public void readOrderType() throws IOException {
        m_order.orderType(m_eDecoder.readStr());
    }

    public void readLmtPrice() throws IOException {
        if (m_version < 29) {
            m_order.lmtPrice(m_eDecoder.readDouble());
        }
        else {
            m_order.lmtPrice(m_eDecoder.readDoubleMax());
        }
    }

    public void readAuxPrice() throws IOException {
        if (m_version < 30) {
            m_order.auxPrice(m_eDecoder.readDouble());
        }
        else {
            m_order.auxPrice(m_eDecoder.readDoubleMax());
        }
    }

    public void readTIF() throws IOException {
        m_order.tif(m_eDecoder.readStr());
    }

    public void readOcaGroup() throws IOException {
        m_order.ocaGroup(m_eDecoder.readStr());
    }

    public void readAccount() throws IOException {
        m_order.account(m_eDecoder.readStr());
    }

    public void readOpenClose() throws IOException {
        m_order.openClose(m_eDecoder.readStr());
    }

    public void readOrigin() throws IOException {
        m_order.origin(m_eDecoder.readInt());
    }

    public void readOrderRef() throws IOException {
        m_order.orderRef(m_eDecoder.readStr());
    }

    public void readClientId() throws IOException {
        if(m_version >= 3) {
            m_order.clientId(m_eDecoder.readInt());
        }
    }

    public void readPermId() throws IOException {
        if( m_version >= 4 ) {
            m_order.permId(m_eDecoder.readInt());
        }
    }

    public void readOutsideRth() throws IOException {
        if( m_version >= 4 ) {
            if ( m_version < 18) {
                // will never happen
                /* order.m_ignoreRth = */ m_eDecoder.readBoolFromInt();
            }
            else {
                m_order.outsideRth(m_eDecoder.readBoolFromInt());
            }
        }
    }

    public void readHidden() throws IOException {
        if( m_version >= 4 ) {
            m_order.hidden(m_eDecoder.readInt() == 1);
        }
    }

    public void readDiscretionaryAmount() throws IOException {
        if( m_version >= 4 ) {
            m_order.discretionaryAmt(m_eDecoder.readDouble());
        }
    }

    public void readGoodAfterTime() throws IOException {
        if ( m_version >= 5 ) {
            m_order.goodAfterTime(m_eDecoder.readStr());
        }
    }

    public void skipSharesAllocation() throws IOException {
        if ( m_version >= 6 ) {
            // skip deprecated sharesAllocation field
            m_eDecoder.readStr();
        }
    }

    public void readFAParams() throws IOException {
        if ( m_version >= 7 ) {
            m_order.faGroup(m_eDecoder.readStr());
            m_order.faMethod(m_eDecoder.readStr());
            m_order.faPercentage(m_eDecoder.readStr());
            m_order.faProfile(m_eDecoder.readStr());
        }
    }

    public void readModelCode() throws IOException {
        if ( m_serverVersion >= EClient.MIN_SERVER_VER_MODELS_SUPPORT) {
            m_order.modelCode(m_eDecoder.readStr());
        }
    }

    public void readGoodTillDate() throws IOException {
        if ( m_version >= 8 ) {
            m_order.goodTillDate(m_eDecoder.readStr());
        }
    }

    public void readRule80A() throws IOException {
        if ( m_version >= 9) {
            m_order.rule80A(m_eDecoder.readStr());
        }
    }

    public void readPercentOffset() throws IOException {
        if ( m_version >= 9) {
            m_order.percentOffset(m_eDecoder.readDoubleMax());
        }
    }

    public void readSettlingFirm() throws IOException {
        if ( m_version >= 9) {
            m_order.settlingFirm(m_eDecoder.readStr());
        }
    }

    public void readShortSaleParams() throws IOException {
        if ( m_version >= 9) {
            m_order.shortSaleSlot(m_eDecoder.readInt());
            m_order.designatedLocation(m_eDecoder.readStr());
            if ( m_serverVersion == 51){
                m_eDecoder.readInt(); // exemptCode
            }
            else if ( m_version >= 23){
                m_order.exemptCode(m_eDecoder.readInt());
            }
        }
    }

    public void readAuctionStrategy() throws IOException {
        if ( m_version >= 9) {
            m_order.auctionStrategy(m_eDecoder.readInt());
        }
    }

    public void readBoxOrderParams() throws IOException {
        if ( m_version >= 9) {
            m_order.startingPrice(m_eDecoder.readDoubleMax());
            m_order.stockRefPrice(m_eDecoder.readDoubleMax());
            m_order.delta(m_eDecoder.readDoubleMax());
        }
    }

    public void readPegToStkOrVolOrderParams() throws IOException {
        if ( m_version >= 9) {
            m_order.stockRangeLower(m_eDecoder.readDoubleMax());
            m_order.stockRangeUpper(m_eDecoder.readDoubleMax());
        }
    }

    public void readDisplaySize() throws IOException {
        if ( m_version >= 9) {
            m_order.displaySize(m_eDecoder.readIntMax());
        }
    }

    public void readOldStyleOutsideRth() throws IOException {
        if ( m_version >= 9) {
            if ( m_version < 18) {
                // will never happen
                /* order.m_rthOnly = */ m_eDecoder.readBoolFromInt();
            }
        }
    }

    public void readBlockOrder() throws IOException {
        if ( m_version >= 9) {
            m_order.blockOrder(m_eDecoder.readBoolFromInt());
        }
    }

    public void readSweepToFill() throws IOException {
        if ( m_version >= 9) {
            m_order.sweepToFill(m_eDecoder.readBoolFromInt());
        }
    }

    public void readAllOrNone() throws IOException {
        if ( m_version >= 9) {
            m_order.allOrNone(m_eDecoder.readBoolFromInt());
        }
    }

    public void readMinQty() throws IOException {
        if ( m_version >= 9) {
            m_order.minQty(m_eDecoder.readIntMax());
        }
    }

    public void readOcaType() throws IOException {
        if ( m_version >= 9) {
            m_order.ocaType(m_eDecoder.readInt());
        }
    }

    public void readETradeOnly() throws IOException {
        if ( m_version >= 9) {
            // skip deprecated field
            m_eDecoder.readBoolFromInt();
        }
    }

    public void readFirmQuoteOnly() throws IOException {
        if ( m_version >= 9) {
            // skip deprecated field
            m_eDecoder.readBoolFromInt();
        }
    }

    public void readNbboPriceCap() throws IOException {
        if ( m_version >= 9) {
            // skip deprecated field
            m_eDecoder.readDoubleMax();
        }
    }

    public void readParentId() throws IOException {
        if ( m_version >= 10) {
            m_order.parentId(m_eDecoder.readInt());
        }
    }

    public void readTriggerMethod() throws IOException {
        if ( m_version >= 10) {
            m_order.triggerMethod(m_eDecoder.readInt());
        }
    }

    public void readVolOrderParams(boolean readOpenOrderAttribs) throws IOException {
        if (m_version >= 11) {
            m_order.volatility(m_eDecoder.readDoubleMax());
            m_order.volatilityType(m_eDecoder.readInt());
            if (m_version == 11) {
                int receivedInt = m_eDecoder.readInt();
                m_order.deltaNeutralOrderType( (receivedInt == 0) ? "NONE" : "MKT" );
            } else {
                m_order.deltaNeutralOrderType(m_eDecoder.readStr());
                m_order.deltaNeutralAuxPrice(m_eDecoder.readDoubleMax());

                if (m_version >= 27 && !Util.StringIsEmpty(m_order.getDeltaNeutralOrderType())) {
                    m_order.deltaNeutralConId(m_eDecoder.readInt());
                    if (readOpenOrderAttribs) {
                        m_order.deltaNeutralSettlingFirm(m_eDecoder.readStr());
                        m_order.deltaNeutralClearingAccount(m_eDecoder.readStr());
                        m_order.deltaNeutralClearingIntent(m_eDecoder.readStr());
                    }
                }

                if (m_version >= 31 && !Util.StringIsEmpty(m_order.getDeltaNeutralOrderType())) {
                    if (readOpenOrderAttribs) {
                        m_order.deltaNeutralOpenClose(m_eDecoder.readStr());
                    }
                    m_order.deltaNeutralShortSale(m_eDecoder.readBoolFromInt());
                    m_order.deltaNeutralShortSaleSlot(m_eDecoder.readInt());
                    m_order.deltaNeutralDesignatedLocation(m_eDecoder.readStr());
                }
            }
            m_order.continuousUpdate(m_eDecoder.readInt());
            if (m_serverVersion == 26) {
                m_order.stockRangeLower(m_eDecoder.readDouble());
                m_order.stockRangeUpper(m_eDecoder.readDouble());
            }
            m_order.referencePriceType(m_eDecoder.readInt());
        }
    }

    public void readTrailParams() throws IOException {
        if (m_version >= 13) {
            m_order.trailStopPrice(m_eDecoder.readDoubleMax());
        }

        if (m_version >= 30) {
            m_order.trailingPercent(m_eDecoder.readDoubleMax());
        }
    }

    public void readBasisPoints() throws IOException {
        if (m_version >= 14) {
            m_order.basisPoints(m_eDecoder.readDoubleMax());
            m_order.basisPointsType(m_eDecoder.readIntMax());
        }
    }
    

    public void readComboLegs() throws IOException {
        if (m_version >= 14) {
            m_contract.comboLegsDescrip(m_eDecoder.readStr());
        }

        if (m_version >= 29) {
            int comboLegsCount = m_eDecoder.readInt();
            if (comboLegsCount > 0) {
                m_contract.comboLegs(new ArrayList<>(comboLegsCount));
                for (int i = 0; i < comboLegsCount; ++i) {
                    int conId = m_eDecoder.readInt();
                    int ratio = m_eDecoder.readInt();
                    String action = m_eDecoder.readStr();
                    String exchange = m_eDecoder.readStr();
                    int openClose = m_eDecoder.readInt();
                    int shortSaleSlot = m_eDecoder.readInt();
                    String designatedLocation = m_eDecoder.readStr();
                    int exemptCode = m_eDecoder.readInt();

                    ComboLeg comboLeg = new ComboLeg(conId, ratio, action, exchange, openClose,
                            shortSaleSlot, designatedLocation, exemptCode);
                    m_contract.comboLegs().add(comboLeg);
                }
            }

            int orderComboLegsCount = m_eDecoder.readInt();
            if (orderComboLegsCount > 0) {
                m_order.orderComboLegs(new ArrayList<>(orderComboLegsCount));
                for (int i = 0; i < orderComboLegsCount; ++i) {
                    double price = m_eDecoder.readDoubleMax();

                    OrderComboLeg orderComboLeg = new OrderComboLeg(price);
                    m_order.orderComboLegs().add(orderComboLeg);
                }
            }
        }
    }

    public void readSmartComboRoutingParams() throws IOException {
        if (m_version >= 26) {
            int smartComboRoutingParamsCount = m_eDecoder.readInt();
            if (smartComboRoutingParamsCount > 0) {
                m_order.smartComboRoutingParams(new ArrayList<>(smartComboRoutingParamsCount));
                for (int i = 0; i < smartComboRoutingParamsCount; ++i) {
                    TagValue tagValue = new TagValue();
                    tagValue.m_tag = m_eDecoder.readStr();
                    tagValue.m_value = m_eDecoder.readStr();
                    m_order.smartComboRoutingParams().add(tagValue);
                }
            }
        }
    }

    public void readScaleOrderParams() throws IOException {
        if (m_version >= 15) {
            if (m_version >= 20) {
                m_order.scaleInitLevelSize(m_eDecoder.readIntMax());
                m_order.scaleSubsLevelSize(m_eDecoder.readIntMax());
            }
            else {
                /* int notSuppScaleNumComponents = */ m_eDecoder.readIntMax();
                m_order.scaleInitLevelSize(m_eDecoder.readIntMax());
            }
            m_order.scalePriceIncrement(m_eDecoder.readDoubleMax());
        }

        if (m_version >= 28 && m_order.scalePriceIncrement() > 0.0 && m_order.scalePriceIncrement() != Double.MAX_VALUE) {
            m_order.scalePriceAdjustValue(m_eDecoder.readDoubleMax());
            m_order.scalePriceAdjustInterval(m_eDecoder.readIntMax());
            m_order.scaleProfitOffset(m_eDecoder.readDoubleMax());
            m_order.scaleAutoReset(m_eDecoder.readBoolFromInt());
            m_order.scaleInitPosition(m_eDecoder.readIntMax());
            m_order.scaleInitFillQty(m_eDecoder.readIntMax());
            m_order.scaleRandomPercent(m_eDecoder.readBoolFromInt());
        }
    }

    public void readHedgeParams() throws IOException {
        if (m_version >= 24) {
            m_order.hedgeType(m_eDecoder.readStr());
            if (!Util.StringIsEmpty(m_order.getHedgeType())) {
                m_order.hedgeParam(m_eDecoder.readStr());
            }
        }
    }

    public void readOptOutSmartRouting() throws IOException {
        if (m_version >= 25) {
            m_order.optOutSmartRouting(m_eDecoder.readBoolFromInt());
        }
    }

    public void readClearingParams() throws IOException {
        if (m_version >= 19) {
            m_order.clearingAccount(m_eDecoder.readStr());
            m_order.clearingIntent(m_eDecoder.readStr());
        }
    }

    public void readNotHeld() throws IOException {
        if (m_version >= 22) {
            m_order.notHeld(m_eDecoder.readBoolFromInt());
        }
    }

    public void readDeltaNeutral() throws IOException {
        if (m_version >= 20) {
            if (m_eDecoder.readBoolFromInt()) {
                DeltaNeutralContract deltaNeutralContract = new DeltaNeutralContract();
                deltaNeutralContract.conid(m_eDecoder.readInt());
                deltaNeutralContract.delta(m_eDecoder.readDouble());
                deltaNeutralContract.price(m_eDecoder.readDouble());
                m_contract.deltaNeutralContract(deltaNeutralContract);
            }
        }
    }

    public void readAlgoParams() throws IOException {
        if (m_version >= 21) {
            m_order.algoStrategy(m_eDecoder.readStr());
            if (!Util.StringIsEmpty(m_order.getAlgoStrategy())) {
                int algoParamsCount = m_eDecoder.readInt();
                if (algoParamsCount > 0) {
                    for (int i = 0; i < algoParamsCount; ++i) {
                        TagValue tagValue = new TagValue();
                        tagValue.m_tag = m_eDecoder.readStr();
                        tagValue.m_value = m_eDecoder.readStr();
                        m_order.algoParams().add(tagValue);
                    }
                }
            }
        }
    }

    public void readSolicited() throws IOException {
        if (m_version >= 33) {
            m_order.solicited(m_eDecoder.readBoolFromInt());
        }
    }

    public void readWhatIfInfoAndCommission() throws IOException {
        if (m_version >= 16) {
            m_order.whatIf(m_eDecoder.readBoolFromInt());

            readOrderStatus();

            if (m_serverVersion >= EClient.MIN_SERVER_VER_WHAT_IF_EXT_FIELDS) {
                m_orderState.initMarginBefore(m_eDecoder.readStr());
                m_orderState.maintMarginBefore(m_eDecoder.readStr());
                m_orderState.equityWithLoanBefore(m_eDecoder.readStr());
                m_orderState.initMarginChange(m_eDecoder.readStr());
                m_orderState.maintMarginChange(m_eDecoder.readStr());
                m_orderState.equityWithLoanChange(m_eDecoder.readStr());
            }

            m_orderState.initMarginAfter(m_eDecoder.readStr());
            m_orderState.maintMarginAfter(m_eDecoder.readStr());
            m_orderState.equityWithLoanAfter(m_eDecoder.readStr());
            m_orderState.commission(m_eDecoder.readDoubleMax());
            m_orderState.minCommission(m_eDecoder.readDoubleMax());
            m_orderState.maxCommission(m_eDecoder.readDoubleMax());
            m_orderState.commissionCurrency(m_eDecoder.readStr());
            m_orderState.warningText(m_eDecoder.readStr());
        }
    }

    public void readOrderStatus() throws IOException {
        m_orderState.status(m_eDecoder.readStr());
    }

    public void readVolRandomizeFlags() throws IOException {
        if (m_version >= 34) {
            m_order.randomizeSize(m_eDecoder.readBoolFromInt());
            m_order.randomizePrice(m_eDecoder.readBoolFromInt());
        }
    }

    public void readPegToBenchParams() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
            if (m_order.orderType() == OrderType.PEG_BENCH) {
                m_order.referenceContractId(m_eDecoder.readInt());
                m_order.isPeggedChangeAmountDecrease(m_eDecoder.readBoolFromInt());
                m_order.peggedChangeAmount(m_eDecoder.readDouble());
                m_order.referenceChangeAmount(m_eDecoder.readDouble());
                m_order.referenceExchangeId(m_eDecoder.readStr());
            }
        }
    }

    public void readConditions() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {

            int nConditions = m_eDecoder.readInt();

            if (nConditions > 0) {          
                for (int i = 0; i < nConditions; i++) {
                    OrderConditionType orderConditionType = OrderConditionType.fromInt(m_eDecoder.readInt());              
                    OrderCondition condition = OrderCondition.create(orderConditionType);

                    condition.readFrom(m_eDecoder);
                    m_order.conditions().add(condition);
                }

                m_order.conditionsIgnoreRth(m_eDecoder.readBoolFromInt());
                m_order.conditionsCancelOrder(m_eDecoder.readBoolFromInt());
            }
        }
    }

    public void readAdjustedOrderParams() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_PEGGED_TO_BENCHMARK) {
            m_order.adjustedOrderType(OrderType.get(m_eDecoder.readStr()));
            m_order.triggerPrice(m_eDecoder.readDoubleMax());
            readStopPriceAndLmtPriceOffset();
            m_order.adjustedStopPrice(m_eDecoder.readDoubleMax());
            m_order.adjustedStopLimitPrice(m_eDecoder.readDoubleMax());
            m_order.adjustedTrailingAmount(m_eDecoder.readDoubleMax());
            m_order.adjustableTrailingUnit(m_eDecoder.readInt());
        }
    }

    public void readStopPriceAndLmtPriceOffset() throws IOException {
        m_order.trailStopPrice(m_eDecoder.readDoubleMax());
        m_order.lmtPriceOffset(m_eDecoder.readDoubleMax());
    }

    public void readSoftDollarTier() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_SOFT_DOLLAR_TIER) {
            m_order.softDollarTier(new SoftDollarTier(m_eDecoder.readStr(), m_eDecoder.readStr(), m_eDecoder.readStr()));
        }
    }

    public void readCashQty() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_CASH_QTY) {
            m_order.cashQty(m_eDecoder.readDoubleMax());
        }
    }

    public void readDontUseAutoPriceForHedge() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_AUTO_PRICE_FOR_HEDGE) {
            m_order.dontUseAutoPriceForHedge(m_eDecoder.readBoolFromInt());
        }
    }

    public void readIsOmsContainer() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_ORDER_CONTAINER) {
            m_order.isOmsContainer(m_eDecoder.readBoolFromInt());
        }
    }

    public void readDiscretionaryUpToLimitPrice() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_D_PEG_ORDERS) {
            m_order.discretionaryUpToLimitPrice(m_eDecoder.readBoolFromInt());
        }
    }

    public void readAutoCancelDate() throws IOException {
        m_order.autoCancelDate(m_eDecoder.readStr());
    }

    public void readFilledQuantity() throws IOException {
        m_order.filledQuantity(m_eDecoder.readDecimal());
    }

    public void readRefFuturesConId() throws IOException {
        m_order.refFuturesConId(m_eDecoder.readInt());
    }

    public void readAutoCancelParent() throws IOException {
        readAutoCancelParent(EClient.MIN_VERSION);
    }

    public void readAutoCancelParent(int minVersionAutoCancelParent) throws IOException {
        if (m_serverVersion >= minVersionAutoCancelParent) {
            m_order.autoCancelParent(m_eDecoder.readBoolFromInt());
        }
    }

    public void readShareholder() throws IOException {
        m_order.shareholder(m_eDecoder.readStr());
    }

    public void readImbalanceOnly() throws IOException {
        m_order.imbalanceOnly(m_eDecoder.readBoolFromInt());
    }

    public void readRouteMarketableToBbo() throws IOException {
        m_order.routeMarketableToBbo(m_eDecoder.readBoolFromInt());
    }

    public void readParentPermId() throws IOException {
        m_order.parentPermId(m_eDecoder.readLong());
    }

    public void readCompletedTime() throws IOException {
        m_orderState.completedTime(m_eDecoder.readStr());
    }

    public void readCompletedStatus() throws IOException {
        m_orderState.completedStatus(m_eDecoder.readStr());
    }

    public void readUsePriceMgmtAlgo() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_PRICE_MGMT_ALGO) {
            m_order.usePriceMgmtAlgo(m_eDecoder.readBoolFromInt());
        }
    }
    
    public void readDuration() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_DURATION) {
            m_order.duration(m_eDecoder.readInt());
        }
    }

    public void readPostToAts() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_POST_TO_ATS) {
            m_order.postToAts(m_eDecoder.readIntMax());
        }
    }

    public void readPegBestPegMidOrderAttributes() throws IOException {
        if (m_serverVersion >= EClient.MIN_SERVER_VER_PEGBEST_PEGMID_OFFSETS) {
            m_order.minTradeQty(m_eDecoder.readIntMax());
            m_order.minCompeteSize(m_eDecoder.readIntMax());
            m_order.competeAgainstBestOffset(m_eDecoder.readDoubleMax());
            m_order.midOffsetAtWhole(m_eDecoder.readDoubleMax());
            m_order.midOffsetAtHalf(m_eDecoder.readDoubleMax());
        }
    }
}
