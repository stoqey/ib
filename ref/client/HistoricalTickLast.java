/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class HistoricalTickLast {
    private long m_time;
    private TickAttribLast m_tickAttribLast;
    private double m_price;
    private long m_size;
    private String m_exchange;
    private String m_specialConditions;

    public HistoricalTickLast(long time, TickAttribLast tickAttribLast, double price, long size, String exchange, String specialConditions) {
        m_time = time;
        m_tickAttribLast = tickAttribLast;
        m_price = price;
        m_size = size;
        m_exchange = exchange;
        m_specialConditions = specialConditions;
    }

    public long time() {
        return m_time;
    }

    public TickAttribLast tickAttribLast() {
        return m_tickAttribLast;
    }
    
    public double price() {
        return m_price;
    }

    public long size() {
        return m_size;
    }

    public String exchange() {
        return m_exchange;
    }

    public String specialConditions() {
        return m_specialConditions;
    }
}