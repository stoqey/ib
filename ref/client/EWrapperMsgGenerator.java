/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.text.DateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

public class EWrapperMsgGenerator {
    public static final String SCANNER_PARAMETERS = "SCANNER PARAMETERS:";
    public static final String FINANCIAL_ADVISOR = "FA:";
    
	public static String tickPrice( int tickerId, int field, double price, TickAttrib attribs) {
    	return "id=" + tickerId + "  " + TickType.getField( field) + "=" + Util.DoubleMaxString(price) + " " + 
        (attribs.canAutoExecute() ? " canAutoExecute" : " noAutoExecute") + " pastLimit = " + attribs.pastLimit() +
        (field == TickType.BID.index() || field == TickType.ASK.index() ? " preOpen = " + attribs.preOpen() : "");
    }
	
    public static String tickSize( int tickerId, int field, Decimal size) {
    	return "id=" + tickerId + "  " + TickType.getField( field) + "=" + size;
    }
    
    public static String tickOptionComputation( int tickerId, int field, int tickAttrib, double impliedVol,
    		double delta, double optPrice, double pvDividend,
    		double gamma, double vega, double theta, double undPrice) {
	return "id=" + tickerId + "  " + TickType.getField( field) +
            ": tickAttrib = " + Util.IntMaxString(tickAttrib) +
            " impliedVol = " + Util.DoubleMaxString(impliedVol, "N/A") +
            " delta = " + Util.DoubleMaxString(delta, "N/A") +
            " gamma = " + Util.DoubleMaxString(gamma, "N/A") +
            " vega = " + Util.DoubleMaxString(vega, "N/A") +
            " theta = " + Util.DoubleMaxString(theta, "N/A") +
            " optPrice = " + Util.DoubleMaxString(optPrice, "N/A") +
            " pvDividend = " + Util.DoubleMaxString(pvDividend, "N/A") +
            " undPrice = " + Util.DoubleMaxString(undPrice, "N/A");
    }
    
    public static String tickGeneric(int tickerId, int tickType, double value) {
    	return "id=" + tickerId + "  " + TickType.getField( tickType) + "=" + Util.DoubleMaxString(value);
    }
    
    public static String tickString(int tickerId, int tickType, String value) {
    	return "id=" + tickerId + "  " + TickType.getField( tickType) + "=" + value;
    }
    
    public static String tickEFP(int tickerId, int tickType, double basisPoints,
			String formattedBasisPoints, double impliedFuture, int holdDays,
			String futureLastTradeDate, double dividendImpact, double dividendsToLastTradeDate) {
    	return "id=" + tickerId + "  " + TickType.getField(tickType)
		+ ": basisPoints = " + Util.DoubleMaxString(basisPoints) + "/" + formattedBasisPoints
		+ " impliedFuture = " + Util.DoubleMaxString(impliedFuture) + " holdDays = " + Util.IntMaxString(holdDays) +
		" futureLastTradeDate = " + futureLastTradeDate + " dividendImpact = " + Util.DoubleMaxString(dividendImpact) +
		" dividends to expiry = "	+ Util.DoubleMaxString(dividendsToLastTradeDate);
    }
    
    public static String orderStatus( int orderId, String status, Decimal filled, Decimal remaining,
            double avgFillPrice, int permId, int parentId, double lastFillPrice,
            int clientId, String whyHeld, double mktCapPrice) {
    	return "order status: orderId=" + orderId + " clientId=" + Util.IntMaxString(clientId) + " permId=" + Util.IntMaxString(permId) +
        " status=" + status + " filled=" + filled + " remaining=" + remaining +
        " avgFillPrice=" + Util.DoubleMaxString(avgFillPrice) + " lastFillPrice=" + Util.DoubleMaxString(lastFillPrice) +
        " parent Id=" + Util.IntMaxString(parentId) + " whyHeld=" + whyHeld + " mktCapPrice=" + Util.DoubleMaxString(mktCapPrice);
    }
    
    public static String openOrder( int orderId, Contract contract, Order order, OrderState orderState) {
		final StringBuilder sb = new StringBuilder(1024);
        sb.append("open order:");
        appendOrderFields(sb, orderId, contract, order, orderState, true);
        return sb.toString();
    }
    
    public static String openOrderEnd() {
    	return " =============== end ===============";
    }
    
    public static String updateAccountValue(String key, String value, String currency, String accountName) {
    	return "updateAccountValue: " + key + " " + value + " " + currency + " " + accountName;
    }
    
    public static String updatePortfolio(Contract contract, Decimal position, double marketPrice,
    									 double marketValue, double averageCost, double unrealizedPNL,
    									 double realizedPNL, String accountName) {
		return "updatePortfolio: "
            + contractMsg(contract)
            + position + " " + Util.DoubleMaxString(marketPrice) + " " + Util.DoubleMaxString(marketValue) + " " 
            + Util.DoubleMaxString(averageCost) + " " + Util.DoubleMaxString(unrealizedPNL) + " " 
            + Util.DoubleMaxString(realizedPNL) + " " + accountName;
    }
    
    public static String updateAccountTime(String timeStamp) {
    	return "updateAccountTime: " + timeStamp;
    }
    
    public static String accountDownloadEnd(String accountName) {
    	return "accountDownloadEnd: " + accountName;
    }
    
    public static String nextValidId( int orderId) {
    	return "Next Valid Order ID: " + orderId;
    }
    
    public static String contractDetails(int reqId, ContractDetails contractDetails) {
    	Contract contract = contractDetails.contract();
		return "reqId = " + reqId + " ===================================\n"
            + " ---- Contract Details begin ----\n"
            + contractMsg(contract) + contractDetailsMsg(contractDetails)
            + " ---- Contract Details End ----\n";
    }
    
    private static String contractDetailsMsg(ContractDetails contractDetails) {
		return "marketName = " + contractDetails.marketName() + "\n"
        + "minTick = " + Util.DoubleMaxString(contractDetails.minTick()) + "\n"
        + "price magnifier = " + Util.IntMaxString(contractDetails.priceMagnifier()) + "\n"
        + "orderTypes = " + contractDetails.orderTypes() + "\n"
        + "validExchanges = " + contractDetails.validExchanges() + "\n"
        + "underConId = " + Util.IntMaxString(contractDetails.underConid()) + "\n"
        + "longName = " + contractDetails.longName() + "\n"
        + "contractMonth = " + contractDetails.contractMonth() + "\n"
        + "industry = " + contractDetails.industry() + "\n"
        + "category = " + contractDetails.category() + "\n"
        + "subcategory = " + contractDetails.subcategory() + "\n"
        + "timeZoneId = " + contractDetails.timeZoneId() + "\n"
        + "tradingHours = " + contractDetails.tradingHours() + "\n"
        + "liquidHours = " + contractDetails.liquidHours() + "\n"
        + "evRule = " + contractDetails.evRule() + "\n"
        + "evMultiplier = " + Util.DoubleMaxString(contractDetails.evMultiplier()) + "\n"
        + "aggGroup = " + Util.IntMaxString(contractDetails.aggGroup()) + "\n"
        + "underSymbol = " + contractDetails.underSymbol() + "\n"
        + "underSecType = " + contractDetails.underSecType() + "\n"
        + "marketRuleIds = " + contractDetails.marketRuleIds() + "\n"
        + "realExpirationDate = " + contractDetails.realExpirationDate() + "\n"
        + "lastTradeTime = " + contractDetails.lastTradeTime() + "\n"
        + "stockType = " + contractDetails.stockType() + "\n"
        + "minSize = " + contractDetails.minSize() + "\n"
        + "sizeIncrement = " + contractDetails.sizeIncrement() + "\n"
        + "suggestedSizeIncrement = " + contractDetails.suggestedSizeIncrement() + "\n"
        + contractDetailsSecIdList(contractDetails);
    }
    
	private static String contractMsg(Contract contract) {
		return "conid = " + contract.conid() + "\n"
        + "symbol = " + contract.symbol() + "\n"
        + "secType = " + contract.getSecType() + "\n"
        + "lastTradeDate = " + contract.lastTradeDateOrContractMonth() + "\n"
        + "strike = " + Util.DoubleMaxString(contract.strike()) + "\n"
        + "right = " + contract.getRight() + "\n"
        + "multiplier = " + contract.multiplier() + "\n"
        + "exchange = " + contract.exchange() + "\n"
        + "primaryExch = " + contract.primaryExch() + "\n"
        + "currency = " + contract.currency() + "\n"
        + "localSymbol = " + contract.localSymbol() + "\n"
        + "tradingClass = " + contract.tradingClass() + "\n";
    }
	
    public static String bondContractDetails(int reqId, ContractDetails contractDetails) {
        Contract contract = contractDetails.contract();
		return "reqId = " + reqId + " ===================================\n"	
        + " ---- Bond Contract Details begin ----\n"
        + "symbol = " + contract.symbol() + "\n"
        + "secType = " + contract.getSecType() + "\n"
        + "cusip = " + contractDetails.cusip() + "\n"
        + "coupon = " + Util.DoubleMaxString(contractDetails.coupon()) + "\n"
        + "maturity = " + contractDetails.maturity() + "\n"
        + "issueDate = " + contractDetails.issueDate() + "\n"
        + "ratings = " + contractDetails.ratings() + "\n"
        + "bondType = " + contractDetails.bondType() + "\n"
        + "couponType = " + contractDetails.couponType() + "\n"
        + "convertible = " + contractDetails.convertible() + "\n"
        + "callable = " + contractDetails.callable() + "\n"
        + "putable = " + contractDetails.putable() + "\n"
        + "descAppend = " + contractDetails.descAppend() + "\n"
        + "exchange = " + contract.exchange() + "\n"
        + "currency = " + contract.currency() + "\n"
        + "marketName = " + contractDetails.marketName() + "\n"
        + "tradingClass = " + contract.tradingClass() + "\n"
        + "conid = " + contract.conid() + "\n"
        + "minTick = " + Util.DoubleMaxString(contractDetails.minTick()) + "\n"
        + "orderTypes = " + contractDetails.orderTypes() + "\n"
        + "validExchanges = " + contractDetails.validExchanges() + "\n"
        + "nextOptionDate = " + contractDetails.nextOptionDate() + "\n"
        + "nextOptionType = " + contractDetails.nextOptionType() + "\n"
        + "nextOptionPartial = " + contractDetails.nextOptionPartial() + "\n"
        + "notes = " + contractDetails.notes() + "\n"
        + "longName = " + contractDetails.longName() + "\n"
        + "evRule = " + contractDetails.evRule() + "\n"
        + "evMultiplier = " + Util.DoubleMaxString(contractDetails.evMultiplier()) + "\n"
        + "aggGroup = " + Util.IntMaxString(contractDetails.aggGroup()) + "\n"
        + "marketRuleIds = " + contractDetails.marketRuleIds() + "\n"
        + "timeZoneId = " + contractDetails.timeZoneId() + "\n"
        + "lastTradeTime = " + contractDetails.lastTradeTime() + "\n"
        + "minSize = " + contractDetails.minSize() + "\n"
        + "sizeIncrement = " + contractDetails.sizeIncrement() + "\n"
        + "suggestedSizeIncrement = " + contractDetails.suggestedSizeIncrement() + "\n"
        + contractDetailsSecIdList(contractDetails)
        + " ---- Bond Contract Details End ----\n";
    }
    
    private static String contractDetailsSecIdList(ContractDetails contractDetails) {
        final StringBuilder sb = new StringBuilder(32);
        sb.append("secIdList={");
        if (contractDetails.secIdList() != null) {
			for (TagValue param : contractDetails.secIdList()) {
				sb.append(param.m_tag).append("=").append(param.m_value).append(',');
			}
			if (!contractDetails.secIdList().isEmpty()) {
				sb.setLength(sb.length() - 1);
			}
        }
        sb.append("}\n");
        return sb.toString();
    }

    public static String contractDetailsEnd(int reqId) {
    	return "reqId = " + reqId + " =============== end ===============";
    }
    
    public static String execDetails( int reqId, Contract contract, Execution execution) {
		return " ---- Execution Details begin ----\n"
        + "reqId = " + reqId + "\n"
        + "orderId = " + execution.orderId() + "\n"
        + "clientId = " + Util.IntMaxString(execution.clientId()) + "\n"
        + contractMsg(contract)
        + "execId = " + execution.execId() + "\n"
        + "time = " + execution.time() + "\n"
        + "acctNumber = " + execution.acctNumber() + "\n"
        + "executionExchange = " + execution.exchange() + "\n"
        + "side = " + execution.side() + "\n"
        + "shares = " + execution.shares() + "\n"
        + "price = " + Util.DoubleMaxString(execution.price()) + "\n"
        + "permId = " + Util.IntMaxString(execution.permId()) + "\n"
        + "liquidation = " + Util.IntMaxString(execution.liquidation()) + "\n"
        + "cumQty = " + execution.cumQty() + "\n"
        + "avgPrice = " + Util.DoubleMaxString(execution.avgPrice()) + "\n"
        + "orderRef = " + execution.orderRef() + "\n"
        + "evRule = " + execution.evRule() + "\n"
        + "evMultiplier = " + Util.DoubleMaxString(execution.evMultiplier()) + "\n"
        + "modelCode = " + execution.modelCode() + "\n"
        + "lastLiquidity = " + execution.lastLiquidity() + "\n"
        + " ---- Execution Details end ----\n";
    }
    
    public static String execDetailsEnd(int reqId) {
    	return "reqId = " + reqId + " =============== end ===============";
    }
    
    public static String updateMktDepth( int tickerId, int position, int operation, int side,
    									 double price, Decimal size) {
    	return "updateMktDepth: " + tickerId + " " + position + " " + operation + " " + side + " " + Util.DoubleMaxString(price) + " " + size;
    }
    
    public static String updateMktDepthL2( int tickerId, int position, String marketMaker,
    									   int operation, int side, double price, Decimal size, boolean isSmartDepth) {
    	return "updateMktDepth: " + tickerId + " " + position + " " + marketMaker + " " + operation + " " + side + " " + Util.DoubleMaxString(price) + " " + size + " " + isSmartDepth;
    }
    
    public static String updateNewsBulletin( int msgId, int msgType, String message, String origExchange) {
    	return "MsgId=" + msgId + " :: MsgType=" + Util.IntMaxString(msgType) +  " :: Origin=" + origExchange + " :: Message=" + message;
    }
    
    public static String managedAccounts( String accountsList) {
    	return "Connected : The list of managed accounts are : [" + accountsList + "]";
    }
    
    public static String receiveFA(int faDataType, String xml) {
    	return FINANCIAL_ADVISOR + " " + EClient.faMsgTypeName(faDataType) + " " + xml;
    }
    
    public static String historicalData(int reqId, String date, double open, double high, double low,
                      					double close, Decimal volume, int count, Decimal WAP) {
    	return "id=" + reqId +
        " date = " + date +
        " open=" + Util.DoubleMaxString(open) +
        " high=" + Util.DoubleMaxString(high) +
        " low=" + Util.DoubleMaxString(low) +
        " close=" + Util.DoubleMaxString(close) +
        " volume=" + volume +
        " count=" + Util.IntMaxString(count) +
        " WAP=" + WAP;
    }
    public static String historicalDataEnd(int reqId, String startDate, String endDate) {
    	return "id=" + reqId +
    			" start date = " + startDate +
    			" end date=" + endDate;
    }
    
	public static String realtimeBar(int reqId, long time, double open,
			double high, double low, double close, Decimal volume, Decimal wap, int count) {
        return "id=" + reqId +
        " time = " + Util.LongMaxString(time) +
        " open=" + Util.DoubleMaxString(open) +
        " high=" + Util.DoubleMaxString(high) +
        " low=" + Util.DoubleMaxString(low) +
        " close=" + Util.DoubleMaxString(close) +
        " volume=" + volume +
        " count=" + Util.IntMaxString(count) +
        " WAP=" + wap;
	}
	
    public static String scannerParameters(String xml) {
    	return SCANNER_PARAMETERS + "\n" + xml;
    }
    
    public static String scannerData(int reqId, int rank, ContractDetails contractDetails,
    								 String distance, String benchmark, String projection,
    								 String legsStr) {
        Contract contract = contractDetails.contract();
    	return "id = " + reqId +
        " rank=" + Util.IntMaxString(rank) +
        " symbol=" + contract.symbol() +
        " secType=" + contract.getSecType() +
        " lastTradeDate=" + contract.lastTradeDateOrContractMonth() +
        " strike=" + Util.DoubleMaxString(contract.strike()) +
        " right=" + contract.getRight() +
        " exchange=" + contract.exchange() +
        " currency=" + contract.currency() +
        " localSymbol=" + contract.localSymbol() +
        " marketName=" + contractDetails.marketName() +
        " tradingClass=" + contract.tradingClass() +
        " distance=" + distance +
        " benchmark=" + benchmark +
        " projection=" + projection +
        " legsStr=" + legsStr;
    }
    
    public static String scannerDataEnd(int reqId) {
    	return "id = " + reqId + " =============== end ===============";
    }
    
    public static String currentTime(long time) {
		return "current time = " + time +
		" (" + DateFormat.getDateTimeInstance().format(new Date(time * 1000)) + ")";
    }

    public static String fundamentalData(int reqId, String data) {
		return "id  = " + reqId + " len = " + data.length() + '\n' + data;
    }
    
    public static String deltaNeutralValidation(int reqId, DeltaNeutralContract deltaNeutralContract) {
    	return "id = " + reqId
    	+ " deltaNeutralContract.conId =" + deltaNeutralContract.conid()
    	+ " deltaNeutralContract.delta =" + Util.DoubleMaxString(deltaNeutralContract.delta())
    	+ " deltaNeutralContract.price =" + Util.DoubleMaxString(deltaNeutralContract.price());
    }
    public static String tickSnapshotEnd(int tickerId) {
    	return "id=" + tickerId + " =============== end ===============";
    }
    
    public static String marketDataType(int reqId, int marketDataType){
    	return "id=" + reqId + " marketDataType = " + MarketDataType.getField(marketDataType);
    }
    
    public static String commissionReport( CommissionReport commissionReport) {
		return "commission report:" +
        " execId=" + commissionReport.execId() +
        " commission=" + Util.DoubleMaxString(commissionReport.commission()) +
        " currency=" + commissionReport.currency() +
        " realizedPNL=" + Util.DoubleMaxString(commissionReport.realizedPNL()) +
        " yield=" + Util.DoubleMaxString(commissionReport.yield()) +
        " yieldRedemptionDate=" + Util.IntMaxString(commissionReport.yieldRedemptionDate());
    }
    
    public static String position( String account, Contract contract, Decimal pos, double avgCost) {
		return " ---- Position begin ----\n"
        + "account = " + account + "\n"
        + contractMsg(contract)
        + "position = " + pos + "\n"
        + "avgCost = " + Util.DoubleMaxString(avgCost) + "\n"
        + " ---- Position end ----\n";
    }    

    public static String positionEnd() {
        return " =============== end ===============";
    }

    public static String accountSummary( int reqId, String account, String tag, String value, String currency) {
		return " ---- Account Summary begin ----\n"
        + "reqId = " + reqId + "\n"
        + "account = " + account + "\n"
        + "tag = " + tag + "\n"
        + "value = " + value + "\n"
        + "currency = " + currency + "\n"
        + " ---- Account Summary end ----\n";
    }

    public static String accountSummaryEnd( int reqId) {
    	return "id=" + reqId + " =============== end ===============";
    }

    public static String positionMulti( int reqId, String account, String modelCode, Contract contract, Decimal pos, double avgCost) {
		return " ---- Position begin ----\n"
        + "id = " + reqId + "\n"
        + "account = " + account + "\n"
        + "modelCode = " + modelCode + "\n"
        + contractMsg(contract)
        + "position = " + pos + "\n"
        + "avgCost = " + Util.DoubleMaxString(avgCost) + "\n"
        + " ---- Position end ----\n";
    }    

    public static String positionMultiEnd( int reqId) {
        return "id = " + reqId + " =============== end ===============";
    }

    public static String accountUpdateMulti( int reqId, String account, String modelCode, String key, String value, String currency) {
		return " id = " + reqId + " account = " + account + " modelCode = " + modelCode + 
                " key = " + key + " value = " + value + " currency = " + currency;
    }

    public static String accountUpdateMultiEnd( int reqId) {
    	return "id = " + reqId + " =============== end ===============";
    }    

	public static String securityDefinitionOptionalParameter(int reqId, String exchange, int underlyingConId, String tradingClass,
			String multiplier, Set<String> expirations, Set<Double> strikes) {
		final StringBuilder sb = new StringBuilder(128);
		sb.append(" id = ").append(reqId)
				.append(" exchange = ").append(exchange)
				.append(" underlyingConId = ").append(underlyingConId)
				.append(" tradingClass = ").append(tradingClass)
				.append(" multiplier = ").append(multiplier)
				.append(" expirations: ");
		for (String expiration : expirations) {
			sb.append(expiration).append(", ");
		}
		sb.append(" strikes: ");
		for (Double strike : strikes) {
			sb.append(Util.DoubleMaxString(strike)).append(", ");
		}
		return sb.toString();
	}

	public static String securityDefinitionOptionalParameterEnd( int reqId) {
		return "id = " + reqId + " =============== end ===============";
	}

	public static String softDollarTiers(int reqId, SoftDollarTier[] tiers) {
		StringBuilder sb = new StringBuilder();
		sb.append("==== Soft Dollar Tiers Begin (total=").append(tiers.length).append(") reqId: ").append(reqId).append(" ====\n");
		for (int i = 0; i < tiers.length; i++) {
			sb.append("Soft Dollar Tier [").append(i).append("] - name: ").append(tiers[i].name())
					.append(", value: ").append(tiers[i].value()).append("\n");
		}
		sb.append("==== Soft Dollar Tiers End (total=").append(tiers.length).append(") ====\n");

		return sb.toString();
	}

	public static String familyCodes(FamilyCode[] familyCodes) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("==== Family Codes Begin (total=").append(familyCodes.length).append(") ====\n");
        for (int i = 0; i < familyCodes.length; i++) {
            sb.append("Family Code [").append(i)
					.append("] - accountID: ").append(familyCodes[i].accountID())
					.append(", familyCode: ").append(familyCodes[i].familyCodeStr())
					.append("\n");
        }
        sb.append("==== Family Codes End (total=").append(familyCodes.length).append(") ====\n");

        return sb.toString();
    }

    public static String symbolSamples(int reqId, ContractDescription[] contractDescriptions) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("==== Symbol Samples Begin (total=").append(contractDescriptions.length).append(") reqId: ").append(reqId).append(" ====\n");
        for (int i = 0; i < contractDescriptions.length; i++) {
            sb.append("---- Contract Description Begin (").append(i).append(") ----\n");
            sb.append("conId: ").append(contractDescriptions[i].contract().conid()).append("\n");
            sb.append("symbol: ").append(contractDescriptions[i].contract().symbol()).append("\n");
            sb.append("secType: ").append(contractDescriptions[i].contract().secType()).append("\n");
            sb.append("primaryExch: ").append(contractDescriptions[i].contract().primaryExch()).append("\n");
            sb.append("currency: ").append(contractDescriptions[i].contract().currency()).append("\n");
            sb.append("derivativeSecTypes (total=").append(contractDescriptions[i].derivativeSecTypes().length).append("): ");
            for (int j = 0; j < contractDescriptions[i].derivativeSecTypes().length; j++){
                sb.append(contractDescriptions[i].derivativeSecTypes()[j]).append(' ');
            }
            sb.append("\n");
            sb.append("description: ").append(Util.NormalizeString(contractDescriptions[i].contract().description())).append("\n");
            sb.append("issuerId: ").append(Util.NormalizeString(contractDescriptions[i].contract().issuerId())).append("\n");
            sb.append("---- Contract Description End (").append(i).append(") ----\n");
        }
        sb.append("==== Symbol Samples End (total=").append(contractDescriptions.length).append(") reqId: ").append(reqId).append(" ====\n");

        return sb.toString();
    }

	public static String mktDepthExchanges(DepthMktDataDescription[] depthMktDataDescriptions) {
		StringBuilder sb = new StringBuilder();
		sb.append("==== Market Depth Exchanges Begin (total=").append(depthMktDataDescriptions.length).append(") ====\n");
		for (int i = 0; i < depthMktDataDescriptions.length; i++) {
			sb.append("Depth Market Data Description [").append(i).append("] - exchange: ").append(depthMktDataDescriptions[i].exchange())
					.append(", secType: ").append(depthMktDataDescriptions[i].secType())
					.append(", listingExch: ").append(depthMktDataDescriptions[i].listingExch())
					.append(", serviceDataType: ").append(depthMktDataDescriptions[i].serviceDataType())
					.append(", aggGroup: ").append(Util.IntMaxString(depthMktDataDescriptions[i].aggGroup())).append("\n");
		}
		sb.append("==== Market Depth Exchanges End (total=").append(depthMktDataDescriptions.length).append(") ====\n");
		return sb.toString();
	}

	public static String tickNews(int tickerId, long timeStamp, String providerCode, String articleId, String headline, String extraData) {
		return "TickNews. tickerId: " + tickerId + ", timeStamp: " + Util.UnixMillisecondsToString(timeStamp, "yyyyMMdd-HH:mm:ss") + 
				", providerCode: " + providerCode + ", articleId: " + articleId + ", headline: " + headline + ", extraData: " + extraData;
	}

	public static String newsProviders(NewsProvider[] newsProviders) {
		StringBuilder sb = new StringBuilder();
		sb.append("==== News Providers Begin (total=").append(newsProviders.length).append(") ====\n");
		for (int i = 0; i < newsProviders.length; i++) {
			sb.append("News Provider [").append(i).append("] - providerCode: ").append(newsProviders[i].providerCode()).append(", providerName: ")
					.append(newsProviders[i].providerName()).append("\n");
		}
		sb.append("==== News Providers End (total=").append(newsProviders.length).append(") ====\n");

		return sb.toString();
	}

    public static String error( Exception ex) { return "Error - " + ex;}
    public static String error( String str) { return str;}

	public static String error(int id, int errorCode, String errorMsg, String advancedOrderRejectJson) {
		String ret = id + " | " + errorCode + " | " + errorMsg;
		if (advancedOrderRejectJson != null) {
			ret += (" | " + advancedOrderRejectJson);
		}
		return ret;
	}

	public static String connectionClosed() {
		return "Connection Closed";
	}

	public static String softDollarTiers(SoftDollarTier[] tiers) {
		StringBuilder sb = new StringBuilder();
		
		sb.append("==== Soft Dollar Tiers Begin (total=").append(tiers.length).append(") ====\n");
		
		for (SoftDollarTier tier : tiers) {
			sb.append(tier).append("\n");
		}
		
		sb.append("==== Soft Dollar Tiers End (total=").append(tiers.length).append(") ====\n");
		
		return sb.toString();
	}

	public static String tickReqParams(int tickerId, double minTick, String bboExchange, int snapshotPermissions) {
		return "id=" + tickerId + " minTick = " + Util.DoubleMaxString(minTick) + " bboExchange = " + bboExchange + " snapshotPermissions = " + Util.IntMaxString(snapshotPermissions);
	}

	public static String smartComponents(int reqId, Map<Integer, Entry<String, Character>> theMap) {
		StringBuilder sb = new StringBuilder();
		
		sb.append("==== Smart Components Begin (total=").append(theMap.entrySet().size()).append(") reqId = ").append(reqId).append("====\n");
		
		for (Map.Entry<Integer, Entry<String, Character>> item : theMap.entrySet()) {
			sb.append("bit number: ").append(item.getKey()).append(", exchange: ").append(item.getValue().getKey()).append(", exchange letter: ").append(item.getValue().getValue()).append("\n");
		}
		
		sb.append("==== Smart Components End (total=").append(theMap.entrySet().size()).append(") reqId = ").append(reqId).append("====\n");
		
		return sb.toString();
	}

	public static String newsArticle(int requestId, int articleType, String articleText) {
		StringBuilder sb = new StringBuilder();
		sb.append("==== News Article Begin requestId: ").append(requestId).append(" ====\n");
		if (articleType == 0) {
			sb.append("---- Article type is text or html ----\n");
			sb.append(articleText).append("\n");
		} else if (articleType == 1) {
			sb.append("---- Article type is binary/pdf ----\n");
			sb.append("Binary/pdf article text cannot be displayed\n");
		}
		sb.append("==== News Article End requestId: ").append(requestId).append(" ====\n");
		return sb.toString();
	}
	
	public static String historicalNews(int requestId, String time, String providerCode, String articleId, String headline) {
		return "Historical News. RequestId: " + requestId + ", time: " + time + ", providerCode: " + providerCode + 
				", articleId: " + articleId + ", headline: " + headline;
	}

	public static String historicalNewsEnd( int requestId, boolean hasMore) {
		return "Historical News End. RequestId: " + requestId + ", hasMore: " + hasMore;
	}

	public static String headTimestamp(int reqId, String headTimestamp) {		
		return "Head timestamp. Req Id: " + reqId + ", headTimestamp: " + headTimestamp;
	}

	public static String histogramData(int reqId, List<HistogramEntry> items) {
		StringBuilder sb = new StringBuilder();		
		sb.append("Histogram data. Req Id: ").append(reqId).append(", Data (").append(items.size()).append("):\n");		
		items.forEach(i -> sb.append("\tPrice: ").append(Util.DoubleMaxString(i.price())).append(", Size: ").append(i.size()).append("\n"));
		return sb.toString();
	}
	
	public static String rerouteMktDataReq(int reqId, int conId, String exchange) {
		return "Re-route market data request. Req Id: " + reqId + ", Con Id: " + conId + ", Exchange: " + exchange;
	}

	public static String rerouteMktDepthReq(int reqId, int conId, String exchange) {
		return "Re-route market depth request. Req Id: " + reqId + ", Con Id: " + conId + ", Exchange: " + exchange;
	}
	
	public static String marketRule(int marketRuleId, PriceIncrement[] priceIncrements) {
		StringBuilder sb = new StringBuilder(256);
		sb.append("==== Market Rule Begin (marketRuleId=").append(marketRuleId).append(") ====\n");
		for (PriceIncrement priceIncrement : priceIncrements) {
			sb.append("Low Edge: ").append(Util.DoubleMaxString(priceIncrement.lowEdge()));
			sb.append(", Increment: ").append(Util.DoubleMaxString(priceIncrement.increment()));
			sb.append("\n");
		}
		sb.append("==== Market Rule End (marketRuleId=").append(marketRuleId).append(") ====\n");
		return sb.toString();
	}
	

    public static String pnl(int reqId, double dailyPnL, double unrealizedPnL, double realizedPnL) {
		return "Daily PnL. Req Id: " + reqId + ", daily PnL: " + Util.DoubleMaxString(dailyPnL) + ", unrealizedPnL: " + Util.DoubleMaxString(unrealizedPnL) + ", realizedPnL: " + Util.DoubleMaxString(realizedPnL);
    }
    
    public static String pnlSingle(int reqId, Decimal pos, double dailyPnL, double unrealizedPnL, double realizedPnL, double value) {
		return "Daily PnL Single. Req Id: " + reqId + ", pos: " + pos + ", daily PnL: " + Util.DoubleMaxString(dailyPnL) + ", unrealizedPnL: " + Util.DoubleMaxString(unrealizedPnL) + ", realizedPnL: " + Util.DoubleMaxString(realizedPnL) + ", value: " + Util.DoubleMaxString(value);
    }

    public static String historicalTick(int reqId, long time, double price, Decimal size) {
        return "Historical Tick. Req Id: " + reqId + ", time: " + Util.UnixSecondsToString(time, "yyyyMMdd-HH:mm:ss") + ", price: " + Util.DoubleMaxString(price) + ", size: " 
                + size;
    }

    public static String historicalTickBidAsk(int reqId, long time, TickAttribBidAsk tickAttribBidAsk, double priceBid, double priceAsk,
    		Decimal sizeBid, Decimal sizeAsk) {
        return "Historical Tick Bid/Ask. Req Id: " + reqId + ", time: " + Util.UnixSecondsToString(time, "yyyyMMdd-HH:mm:ss") + ", bid price: " + Util.DoubleMaxString(priceBid) 
                + ", ask price: " + Util.DoubleMaxString(priceAsk) + ", bid size: " + sizeBid + ", ask size: " + sizeAsk 
                + ", tick attribs: " + (tickAttribBidAsk.bidPastLow() ? "bidPastLow " : "") + (tickAttribBidAsk.askPastHigh() ? "askPastHigh " : "");
    }

    public static String historicalTickLast(int reqId, long time, TickAttribLast tickAttribLast, double price, Decimal size, String exchange,
            String specialConditions) {        
        return "Historical Tick Last. Req Id: " + reqId + ", time: " + Util.UnixSecondsToString(time, "yyyyMMdd-HH:mm:ss") + ", price: " + Util.DoubleMaxString(price) + ", size: " 
                + size + ", exchange: " + exchange + ", special conditions:" + specialConditions 
                + ", tick attribs: " + (tickAttribLast.pastLimit() ? "pastLimit " : "") + (tickAttribLast.unreported() ? "unreported " : "");
    }
    
    public static String tickByTickAllLast(int reqId, int tickType, long time, double price, Decimal size, TickAttribLast tickAttribLast, 
            String exchange, String specialConditions){
        return (tickType == 1 ? "Last." : "AllLast.") +
                " Req Id: " + reqId + " Time: " + Util.UnixSecondsToString(time, "yyyyMMdd-HH:mm:ss") + " Price: " + Util.DoubleMaxString(price) + " Size: " + size +
                " Exch: " + exchange + " Spec Cond: " + specialConditions + " Tick Attibs: " + (tickAttribLast.pastLimit() ? "pastLimit " : "") +
                (tickType == 1 ? "" : (tickAttribLast.unreported() ? "unreported " : ""));
    }
    
    public static String tickByTickBidAsk(int reqId, long time, double bidPrice, double askPrice, Decimal bidSize, Decimal askSize,
            TickAttribBidAsk tickAttribBidAsk){
        return "BidAsk. Req Id: " + reqId + " Time: " + Util.UnixSecondsToString(time, "yyyyMMdd-HH:mm:ss") + " BidPrice: " + Util.DoubleMaxString(bidPrice) + 
                " AskPrice: " + Util.DoubleMaxString(askPrice) + " BidSize: " + bidSize + " AskSize: " + askSize + " Tick Attibs: " + 
                (tickAttribBidAsk.bidPastLow() ? "bidPastLow " : "") + (tickAttribBidAsk.askPastHigh() ? "askPastHigh " : "");
    }

    public static String tickByTickMidPoint(int reqId, long time, double midPoint){
        return "MidPoint. Req Id: " + reqId + " Time: " + Util.UnixSecondsToString(time, "yyyyMMdd-HH:mm:ss") + " MidPoint: " + Util.DoubleMaxString(midPoint);
    }
    
    public static String orderBound(long orderId, int apiClientId, int apiOrderId){
        return "order bound: apiOrderId=" + Util.IntMaxString(apiOrderId) + " apiClientId=" + Util.IntMaxString(apiClientId) + " permId=" + Util.LongMaxString(orderId);
    }
    
    public static String completedOrder( Contract contract, Order order, OrderState orderState) {
        final StringBuilder sb = new StringBuilder(1024);
        sb.append("completed order:");
        appendOrderFields(sb, Integer.MAX_VALUE, contract, order, orderState, false);
        return sb.toString();
    }
    
    public static String completedOrdersEnd() {
        return "=============== end ===============";
    }
 
    public static String replaceFAEnd(int reqId, String text) {
    	return "id = " + reqId + " ===== " + text + " =====";
    }
    
    public static String wshMetaData(int reqId, String dataJson) {
    	return "wshMetaData. id = " + reqId + " dataJson= " + dataJson;
    } 
    
    public static String wshEventData(int reqId, String dataJson) {
    	return "wshEventData. id = " + reqId + " dataJson= " + dataJson;
    } 

    public static String historicalSchedule(int reqId, String startDateTime, String endDateTime, String timeZone, List<HistoricalSession> sessions) {
        StringBuilder sb = new StringBuilder();
        sb.append("==== Historical Schedule Begin (ReqId=").append(reqId).append(") ====\n");
        sb.append("Start: ").append(startDateTime);
        sb.append(" End: ").append(endDateTime);
        sb.append(" Time Zone: ").append(timeZone);
        sb.append("\n");

        for (HistoricalSession session: sessions) {
            sb.append("Session: ");
            sb.append("Start: ").append(session.startDateTime());
            sb.append(" End: ").append(session.endDateTime());
            sb.append(" Ref Date: ").append(session.refDate());
            sb.append("\n");
        }
        sb.append("==== Historical Schedule End (ReqId=").append(reqId).append(") ====\n");
        return sb.toString();
    }

    public static String userInfo(int reqId, String whiteBrandingId) {
        return "UserInfo. Req Id: " + reqId + " White Branding Id: " + whiteBrandingId;
    } 

    private static void appendOrderFields(StringBuilder sb, int orderId, Contract contract, Order order, OrderState orderState,
            boolean isOpenOrder) {
        Util.appendValidIntValue(sb, "orderId", orderId);
        Util.appendNonEmptyString(sb, "action", order.getAction());
        Util.appendNonEmptyString(sb, "quantity", order.totalQuantity().toString());
        Util.appendPositiveDoubleValue(sb, "cashQty", order.cashQty());
        Util.appendPositiveIntValue(sb, "conid", contract.conid());
        Util.appendNonEmptyString(sb, "symbol", contract.symbol());
        Util.appendNonEmptyString(sb, "secType", contract.getSecType());
        Util.appendNonEmptyString(sb, "lastTradeDate", contract.lastTradeDateOrContractMonth());
        Util.appendPositiveDoubleValue(sb, "strike", contract.strike());
        Util.appendNonEmptyString(sb, "right", contract.getRight(), "?");
        Util.appendNonEmptyString(sb, "multiplier", contract.multiplier());
        Util.appendNonEmptyString(sb, "exchange", contract.exchange());
        Util.appendNonEmptyString(sb, "primaryExch", contract.primaryExch());
        Util.appendNonEmptyString(sb, "currency", contract.currency());
        Util.appendNonEmptyString(sb, "localSymbol", contract.localSymbol());
        Util.appendNonEmptyString(sb, "tradingClass", contract.tradingClass());
        Util.appendNonEmptyString(sb, "type", order.getOrderType());
        Util.appendValidDoubleValue(sb, "lmtPrice", order.lmtPrice());
        Util.appendValidDoubleValue(sb, "auxPrice", order.auxPrice());
        Util.appendNonEmptyString(sb, "TIF", order.getTif());
        Util.appendNonEmptyString(sb, "openClose", order.openClose());
        Util.appendValidIntValue(sb, "origin", order.origin());
        Util.appendNonEmptyString(sb, "orderRef", order.orderRef());
        Util.appendValidIntValue(sb, "clientId", order.clientId());
        Util.appendValidIntValue(sb, "parentId", order.parentId());
        Util.appendValidIntValue(sb, "permId", order.permId());
        Util.appendBooleanFlag(sb, "outsideRth", order.outsideRth());
        Util.appendBooleanFlag(sb, "hidden", order.hidden());
        Util.appendValidDoubleValue(sb, "discretionaryAmt", order.discretionaryAmt());
        Util.appendPositiveIntValue(sb, "displaySize", order.displaySize());
        Util.appendValidIntValue(sb, "triggerMethod", order.getTriggerMethod());
        Util.appendNonEmptyString(sb, "goodAfterTime", order.goodAfterTime());
        Util.appendNonEmptyString(sb, "goodTillDate", order.goodTillDate());
        Util.appendNonEmptyString(sb, "faGroup", order.faGroup());
        Util.appendNonEmptyString(sb, "faMethod", order.getFaMethod());
        Util.appendNonEmptyString(sb, "faPercentage", order.faPercentage());
        Util.appendNonEmptyString(sb, "faProfile", order.faProfile());
        Util.appendPositiveIntValue(sb, "shortSaleSlot", order.shortSaleSlot());
        if (order.shortSaleSlot() > 0) {
            Util.appendNonEmptyString(sb, "designatedLocation", order.designatedLocation());
            Util.appendValidIntValue(sb, "exemptCode", order.exemptCode());
        }
        Util.appendNonEmptyString(sb, "ocaGroup", order.ocaGroup());
        Util.appendPositiveIntValue(sb, "ocaType", order.getOcaType());
        Util.appendNonEmptyString(sb, "rule80A", order.getRule80A());
        Util.appendBooleanFlag(sb, "blockOrder", order.blockOrder());
        Util.appendBooleanFlag(sb, "sweepToFill", order.sweepToFill());
        Util.appendBooleanFlag(sb, "allOrNone", order.allOrNone());
        Util.appendValidIntValue(sb, "minQty", order.minQty());
        Util.appendValidDoubleValue(sb, "percentOffset", order.percentOffset());
        Util.appendBooleanFlag(sb, "optOutSmartRouting", order.optOutSmartRouting());
        Util.appendValidDoubleValue(sb, "startingPrice", order.startingPrice());
        Util.appendValidDoubleValue(sb, "stockRefPrice", order.stockRefPrice());
        Util.appendValidDoubleValue(sb, "delta", order.delta());
        Util.appendValidDoubleValue(sb, "stockRangeLower", order.stockRangeLower());
        Util.appendValidDoubleValue(sb, "stockRangeUpper", order.stockRangeUpper());
        
        Util.appendValidDoubleValue(sb, "volatility", order.volatility());
        if(order.volatility() != Double.MAX_VALUE) {
            Util.appendPositiveIntValue(sb, "volatilityType", order.getVolatilityType());
            Util.appendNonEmptyString(sb, "deltaNeutralOrderType", order.getDeltaNeutralOrderType());
            Util.appendValidDoubleValue(sb, "deltaNeutralAuxPrice", order.deltaNeutralAuxPrice());
            Util.appendPositiveIntValue(sb, "deltaNeutralConId", order.deltaNeutralConId());
            Util.appendNonEmptyString(sb, "deltaNeutralSettlingFirm", order.deltaNeutralSettlingFirm());
            Util.appendNonEmptyString(sb, "deltaNeutralClearingAccount", order.deltaNeutralClearingAccount());
            Util.appendNonEmptyString(sb, "deltaNeutralClearingIntent", order.deltaNeutralClearingIntent());
            Util.appendNonEmptyString(sb, "deltaNeutralOpenClose", order.deltaNeutralOpenClose(), "?");
            Util.appendBooleanFlag(sb, "deltaNeutralShortSale", order.deltaNeutralShortSale());
            if (order.deltaNeutralShortSale()) {
                Util.appendValidIntValue(sb, "deltaNeutralShortSaleSlot", order.deltaNeutralShortSaleSlot());
                Util.appendNonEmptyString(sb, "deltaNeutralDesignatedLocation", order.deltaNeutralDesignatedLocation());
            }
            Util.appendBooleanFlag(sb, "continuousUpdate", order.continuousUpdate());
            Util.appendValidIntValue(sb, "referencePriceType", order.getReferencePriceType());
        }
        Util.appendValidDoubleValue(sb, "trailStopPrice", order.trailStopPrice());
        Util.appendValidDoubleValue(sb, "trailingPercent", order.trailingPercent());
        Util.appendValidDoubleValue(sb, "lmtPriceOffset", order.lmtPriceOffset());
        Util.appendValidIntValue(sb, "scaleInitLevelSize", order.scaleInitLevelSize());
        Util.appendValidIntValue(sb, "scaleSubsLevelSize", order.scaleSubsLevelSize());
        Util.appendValidDoubleValue(sb, "scalePriceIncrement", order.scalePriceIncrement());
        Util.appendValidDoubleValue(sb, "scalePriceAdjustValue", order.scalePriceAdjustValue());
        Util.appendValidIntValue(sb, "scalePriceAdjustInterval", order.scalePriceAdjustInterval());
        Util.appendValidDoubleValue(sb, "scaleProfitOffset", order.scaleProfitOffset());
        Util.appendBooleanFlag(sb, "scaleAutoReset", order.scaleAutoReset());
        Util.appendValidIntValue(sb, "scaleInitPosition", order.scaleInitPosition());
        Util.appendValidIntValue(sb, "scaleInitFillQty", order.scaleInitFillQty());
        Util.appendBooleanFlag(sb, "scaleRandomPercent", order.scaleRandomPercent());
        Util.appendNonEmptyString(sb, "hedgeType", order.getHedgeType());
        Util.appendNonEmptyString(sb, "hedgeParam", order.hedgeParam());
        Util.appendNonEmptyString(sb, "account", order.account());
        Util.appendNonEmptyString(sb, "modelCode", order.modelCode());
        Util.appendNonEmptyString(sb, "settlingFirm", order.settlingFirm());
        Util.appendNonEmptyString(sb, "clearingAccount", order.clearingAccount());
        Util.appendNonEmptyString(sb, "clearingIntent", order.clearingIntent());
        Util.appendBooleanFlag(sb, "notHeld", order.notHeld());
        Util.appendBooleanFlag(sb, "whatIf", order.whatIf());
        Util.appendBooleanFlag(sb, "solicited", order.solicited());
        Util.appendBooleanFlag(sb, "randomizeSize", order.randomizeSize());
        Util.appendBooleanFlag(sb, "randomizePrice", order.randomizePrice());
        Util.appendBooleanFlag(sb, "dontUseAutoPriceForHedge", order.dontUseAutoPriceForHedge());
        Util.appendBooleanFlag(sb, "isOmsContainer", order.isOmsContainer());
        Util.appendBooleanFlag(sb, "discretionaryUpToLimitPrice", order.discretionaryUpToLimitPrice());
        Util.appendBooleanFlag(sb, "usePriceMgmtAlgo", order.usePriceMgmtAlgo());

        if ("PEG BENCH".equals(order.getOrderType())) {
            Util.appendPositiveIntValue(sb, "referenceContractId", order.referenceContractId());
            Util.appendBooleanFlag(sb, "isPeggedChangeAmountDecrease", order.isPeggedChangeAmountDecrease());
            Util.appendValidDoubleValue(sb, "peggedChangeAmount", order.peggedChangeAmount());
            Util.appendValidDoubleValue(sb, "referenceChangeAmount", order.referenceChangeAmount());
            Util.appendNonEmptyString(sb, "referenceExchangeId", order.referenceExchangeId());
        }
        
        if ("BAG".equals(contract.getSecType())) {
            if (contract.comboLegsDescrip() != null) {
                Util.appendNonEmptyString(sb, "comboLegsDescrip", contract.comboLegsDescrip());
            }
            
            sb.append(" comboLegs={");
            if (contract.comboLegs() != null) {
                for (int i = 0; i < contract.comboLegs().size(); ++i) {
                    ComboLeg comboLeg = contract.comboLegs().get(i);
                    sb.append(" leg ").append(i + 1).append(":");
                    Util.appendPositiveIntValue(sb, "conid", comboLeg.conid());
                    Util.appendPositiveIntValue(sb, "ratio", comboLeg.ratio());
                    Util.appendNonEmptyString(sb, "action", comboLeg.getAction());
                    Util.appendNonEmptyString(sb, "exchange", comboLeg.exchange());
                    Util.appendValidIntValue(sb, "openClose", comboLeg.getOpenClose());
                    Util.appendBooleanFlag(sb, "shortSaleSlot", comboLeg.shortSaleSlot());
                    if (comboLeg.shortSaleSlot() > 0) {
                        Util.appendNonEmptyString(sb, "designatedLocation", comboLeg.designatedLocation());
                        Util.appendValidIntValue(sb, "exemptCode", comboLeg.exemptCode());
                    }
                    
                    if (order.orderComboLegs() != null && contract.comboLegs().size() == order.orderComboLegs().size()) {
                        OrderComboLeg orderComboLeg = order.orderComboLegs().get(i);
                        Util.appendValidDoubleValue(sb, "price", orderComboLeg.price());
                    }
                    sb.append(';');
                }
            }
            sb.append('}');
            
            if (order.basisPoints() != Double.MAX_VALUE) {
                Util.appendValidDoubleValue(sb, "basisPoints", order.basisPoints());
                Util.appendValidIntValue(sb, "basisPointsType", order.basisPointsType());
            }
        }
        
        if (contract.deltaNeutralContract() != null) {
            DeltaNeutralContract deltaNeutralContract = contract.deltaNeutralContract();
            sb.append(" deltaNeutralContract={");
            Util.appendPositiveIntValue(sb, "conid", deltaNeutralContract.conid());
            Util.appendValidDoubleValue(sb, "delta", deltaNeutralContract.delta());
            Util.appendValidDoubleValue(sb, "price", deltaNeutralContract.price());
            sb.append("}");
        }

        if (!Util.StringIsEmpty(order.getAlgoStrategy())) {
            Util.appendNonEmptyString(sb, "algoStrategy", order.getAlgoStrategy());
            if (order.algoParams() != null && order.algoParams().size() > 0) {
                sb.append(" algoParams={");
                for (TagValue param : order.algoParams()) {
                    sb.append(param.m_tag).append('=').append(param.m_value).append(',');
                }
                if (!order.algoParams().isEmpty()) {
                    sb.setLength(sb.length() - 1);
                }
                sb.append('}');
            }
        }
        
        if ("BAG".equals(contract.getSecType())) {
            if (order.smartComboRoutingParams() != null && order.smartComboRoutingParams().size() > 0) {
                sb.append(" smartComboRoutingParams={");
                for (TagValue param : order.smartComboRoutingParams()) {
                    sb.append(param.m_tag).append('=').append(param.m_value).append(',');
                }
                if (!order.smartComboRoutingParams().isEmpty()) {
                    sb.setLength(sb.length() - 1);
                }
                sb.append('}');
            }
        }

        
        Util.appendNonEmptyString(sb, "autoCancelDate", order.autoCancelDate());
        Util.appendNonEmptyString(sb, "filledQuantity", order.filledQuantity().toString());
        Util.appendPositiveIntValue(sb, "refFuturesConId", order.refFuturesConId());
        Util.appendBooleanFlag(sb, "autoCancelParent", order.autoCancelParent());
        Util.appendNonEmptyString(sb, "shareholder", order.shareholder());
        Util.appendBooleanFlag(sb, "imbalanceOnly", order.imbalanceOnly());
        Util.appendBooleanFlag(sb, "routeMarketableToBbo", order.routeMarketableToBbo());
        Util.appendValidLongValue(sb, "parentPermId", order.parentPermId());
        Util.appendValidIntValue(sb, "duration", order.duration());
        Util.appendValidIntValue(sb, "postToAts", order.postToAts());

        Util.appendValidIntValue(sb, "minTradeQty", order.minTradeQty());
        Util.appendValidIntValue(sb, "minCompeteSize", order.minCompeteSize());
        if (order.competeAgainstBestOffset() != Double.MAX_VALUE) {
            if (order.isCompeteAgainstBestOffsetUpToMid()) {
                sb.append(Util.SPACE_SYMBOL).append("competeAgainstBestOffsetUpToMid");
            } else {
                sb.append(Util.SPACE_SYMBOL).append("competeAgainstBestOffset").append(Util.EQUALS_SIGN).append(order.competeAgainstBestOffset());
            }
        }
        Util.appendValidDoubleValue(sb, "midOffsetAtWhole", order.midOffsetAtWhole());
        Util.appendValidDoubleValue(sb, "midOffsetAtHalf", order.midOffsetAtHalf());
        
        Util.appendNonEmptyString(sb, "status", orderState.getStatus());
        Util.appendNonEmptyString(sb, "completedTime", orderState.completedTime());
        Util.appendNonEmptyString(sb, "completedStatus", orderState.completedStatus());
        
        if (order.whatIf()) {
            Util.appendValidDoubleValue(sb, "initMarginBefore", orderState.initMarginBefore());
            Util.appendValidDoubleValue(sb, "maintMarginBefore", orderState.maintMarginBefore());
            Util.appendValidDoubleValue(sb, "equityWithLoanBefore", orderState.equityWithLoanBefore());
            Util.appendValidDoubleValue(sb, "initMarginChange", orderState.initMarginChange());
            Util.appendValidDoubleValue(sb, "maintMarginChange", orderState.maintMarginChange());
            Util.appendValidDoubleValue(sb, "equityWithLoanChange", orderState.equityWithLoanChange());
            Util.appendValidDoubleValue(sb, "initMarginAfter", orderState.initMarginAfter());
            Util.appendValidDoubleValue(sb, "maintMarginAfter", orderState.maintMarginAfter());
            Util.appendValidDoubleValue(sb, "equityWithLoanAfter", orderState.equityWithLoanAfter());
            Util.appendValidDoubleValue(sb, "commission", orderState.commission());
            Util.appendValidDoubleValue(sb, "minCommission", orderState.minCommission());
            Util.appendValidDoubleValue(sb, "maxCommission", orderState.maxCommission());
            Util.appendNonEmptyString(sb, "commissionCurrency", orderState.commissionCurrency());
            Util.appendNonEmptyString(sb, "warningText", orderState.warningText());
        }
        
        if (order.conditions() != null && order.conditions().size() > 0) {
            sb.append(" conditions={");
            for (OrderCondition condition : order.conditions()) {
                sb.append(condition).append(";");
            }
            if (!order.conditions().isEmpty()) {
                sb.setLength(sb.length() - 1);
            }
            sb.append('}');
        }
    }
    
    
}