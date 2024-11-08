/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class OrderCancel {
    final public static String EMPTY_STR = "";

    private String m_manualOrderCancelTime;
    private String m_extOperator;
    private int m_manualOrderIndicator;

    // getters
    public String manualOrderCancelTime() { return m_manualOrderCancelTime; }
    public String extOperator()           { return m_extOperator; }
    public int manualOrderIndicator()     { return m_manualOrderIndicator; }

    // setters
    public void manualOrderCancelTime(String v) { m_manualOrderCancelTime = v; }
    public void extOperator(String v)           { m_extOperator = v; }
    public void manualOrderIndicator(int v)     { m_manualOrderIndicator = v; }

    public OrderCancel() {
        this(EMPTY_STR); 
    }

    public OrderCancel(String manualOrderCancelTime) {
        this(manualOrderCancelTime, EMPTY_STR, Integer.MAX_VALUE);
    }

    public OrderCancel(String manualOrderCancelTime, String extOperator, int manualOrderIndicator) {
        m_manualOrderCancelTime = manualOrderCancelTime;
        m_extOperator = extOperator;
        m_manualOrderIndicator = manualOrderIndicator;
    }

    @Override
    public boolean equals(Object p_other) {
        if (this == p_other) {
            return true;
        }
        if (!(p_other instanceof OrderCancel)) {
            return false;
        }
        OrderCancel l_theOther = (OrderCancel)p_other;

        if (Util.StringCompare(m_manualOrderCancelTime, l_theOther.m_manualOrderCancelTime) != 0 ||
            Util.StringCompare(m_extOperator, l_theOther.m_extOperator) != 0
            ) {
            return false;
        }

        if (m_manualOrderIndicator != l_theOther.m_manualOrderIndicator
            ) {
            return false;
        }

        return true;
    }
}
