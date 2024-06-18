/* Copyright (C) 2023 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;
import java.util.stream.Collectors;

import com.ib.client.Types.Method;

public class Group {
    private String m_name;
    private Method m_defaultMethod;
    private List<Account> m_accounts = new ArrayList<Account>();
    private String m_defaultSize;
    private String m_riskCriteria;

    public String name()            { return m_name; }
    public Method defaultMethod()   { return m_defaultMethod; }
    public List<Account> accounts() { return m_accounts; }
    public String defaultSize()     { return m_defaultSize; }
    public String riskCriteria()    { return m_riskCriteria; }

    public void name( String v)              { m_name = v; }
    public void defaultMethod( Method v)     { m_defaultMethod = v; }
    public void addAccount( Account account) { m_accounts.add( account); }
    public void defaultSize(String v)        { m_defaultSize = v; }
    public void riskCriteria(String v)       { m_riskCriteria = v; }

    public String getAllAccounts() {
        return accounts().stream().map(Object::toString).collect(Collectors.joining(";"));
    }

    /** @param val is a string of accounts in format: acct1,amount1;acct2,amount2;... */
    public void setAllAccounts(String val) {
        m_accounts.clear();

        StringTokenizer st1 = new StringTokenizer(val, ";");
        while( st1.hasMoreTokens() ) {
            String account = st1.nextToken();
            StringTokenizer st2 = new StringTokenizer(account, ",");
            if (st2.hasMoreTokens()) {
                String acct = st2.nextToken();
                String amount = null;
                if (st2.hasMoreTokens()) {
                    amount = st2.nextToken();
                }
                m_accounts.add( new Account(acct, amount));
            }
        }
    }
}
