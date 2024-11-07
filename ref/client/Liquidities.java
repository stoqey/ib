/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public enum Liquidities {
    None,
    Added("Added Liquidity"),
    Removed("Removed Liquidity"),
    RoudedOut("Liquidity Routed Out");
    
    private String m_text;
    
    Liquidities(String text) {
        m_text = text;
    }
    
    Liquidities() {
        m_text = "None";
    }
    
    @Override
    public String toString() {
        return m_text;
    }
    
    public static Liquidities fromInt(int n) {
        if (n < 0 || n > Liquidities.values().length) {
            return Liquidities.None;
        }
        
        return Liquidities.values()[n];
    }
    
    public static int toInt(Liquidities l) {
        return l.ordinal();
    }
}
