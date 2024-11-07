/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class IneligibilityReason {
    private String m_id;
    private String m_description;

    // Get
    public String id()          { return m_id; }
    public String description() { return m_description; }

    // Set 
    public void id(String id)                   { m_id = id; }
    public void description(String description) { m_description = description; }

    public IneligibilityReason() { 
    }

    public IneligibilityReason(String p_id, String p_description) {
        m_id = p_id;
        m_description = p_description;
    }

    @Override public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("[id: ").append(m_id);
        sb.append(", description: ").append(m_description);
        sb.append("]");
        return sb.toString();
    }
}
