/* Copyright (C) 2023 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.controller;

public class Account {
    private String m_acct;
    private String m_amount;

    public String acct() { return m_acct; }
    public String amount() { return m_amount; }

    public void acct(String v) { m_acct = v; }
    public void amount(String v) { m_amount = v; }

    Account() { }

    Account(String acct, String amount) {
        m_acct = acct;
        m_amount = amount;
    }
    
    @Override public String toString() {
        return String.format("%s,%s", m_acct, m_amount != null ? m_amount : "");
    }
}
