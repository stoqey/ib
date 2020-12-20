/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class TickByTick {
    private int m_tickType; // 0 - None, 1 - Last, 2 - AllLast, 3 -BidAsk, 4 - MidPoint
    private long m_time;  // in seconds
    private double m_price;
    private long m_size;
    private TickAttribLast m_tickAttribLast;
    private TickAttribBidAsk m_tickAttribBidAsk;
    private String m_exchange;
    private String m_specialConditions;
    private double m_bidPrice;
    private long m_bidSize;
    private double m_askPrice;
    private long m_askSize;
    private double m_midPoint;

    public TickByTick(int tickType, long time, double price, long size, TickAttribLast tickAttribLast, String exchange, String specialConditions) {
    	m_tickType = tickType;
        m_time = time;
        m_price = price;
        m_size = size;
        m_tickAttribLast = tickAttribLast;
        m_exchange = exchange;
        m_specialConditions = specialConditions;
    }

    public TickByTick(long time, double bidPrice, long bidSize, double askPrice, long askSize, TickAttribBidAsk tickAttribBidAsk) {
    	m_tickType = 3;
        m_time = time;
        m_bidPrice = bidPrice;
        m_bidSize = bidSize;
        m_askPrice = askPrice;
        m_askSize = askSize;
        m_tickAttribBidAsk = tickAttribBidAsk;
    }

    public TickByTick(long time, double midPoint) {
    	m_tickType = 4;
        m_time = time;
        m_midPoint = midPoint;
    }
    
    public int tickType() {
        return m_tickType;
    }
    
    public long time() {
        return m_time;
    }

    public double price() {
        return m_price;
    }

    public long size() {
        return m_size;
    }

    public TickAttribLast tickAttribLast() {
    	return m_tickAttribLast;
    }

    public TickAttribBidAsk tickAttribBidAsk() {
    	return m_tickAttribBidAsk;
    }
    
    public String tickAttribLastStr() {
        StringBuilder sb = new StringBuilder();
        sb.append(m_tickAttribLast.pastLimit() ? "PastLimit " : "");
        sb.append(m_tickAttribLast.unreported() ? "Unreported " : "");
        return sb.toString();
    }

    public String tickAttribBidAskStr() {
        StringBuilder sb = new StringBuilder();
        sb.append(m_tickAttribBidAsk.bidPastLow() ? "BidPastLow " : "");
        sb.append(m_tickAttribBidAsk.askPastHigh() ? "AskPastHigh " : "");
        return sb.toString();
    }
    
    public String exchange() {
        return m_exchange;
    }

    public String specialConditions() {
        return m_specialConditions;
    }

    public double bidPrice() {
        return m_bidPrice;
    }

    public long bidSize() {
        return m_bidSize;
    }
    
    public double askPrice() {
        return m_askPrice;
    }

    public long askSize() {
        return m_askSize;
    }

    public double midPoint() {
        return m_midPoint;
    }
}