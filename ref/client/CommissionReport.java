/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class CommissionReport {

    private String m_execId;
    private double m_commission;
    private String m_currency;
    private double m_realizedPNL;
    private double m_yield;
    private int    m_yieldRedemptionDate; // YYYYMMDD format

    public CommissionReport() {
        m_commission = 0;
        m_realizedPNL = 0;
        m_yield = 0;
        m_yieldRedemptionDate = 0;
    }

    @Override
    public boolean equals(Object p_other) {
        if (this == p_other) {
            return true;
        }
        if (!(p_other instanceof CommissionReport)) {
            return false;
        }
        CommissionReport l_theOther = (CommissionReport)p_other;
        return m_execId.equals(l_theOther.m_execId);
    }

    @Override
    public int hashCode() {
        // Since equals() uses m_execId only, the hashCode should do as well.
        return m_execId == null ? 0 : m_execId.hashCode();
    }

	public String execId() {
		return m_execId;
	}

	public void execId(String execId) {
		this.m_execId = execId;
	}

	public double commission() {
		return m_commission;
	}

	public void commission(double commission) {
		this.m_commission = commission;
	}

	public String currency() {
		return m_currency;
	}

	public void currency(String currency) {
		this.m_currency = currency;
	}

	public double realizedPNL() {
		return m_realizedPNL;
	}

	public void realizedPNL(double realizedPNL) {
		this.m_realizedPNL = realizedPNL;
	}

	public double yield() {
		return m_yield;
	}

	public void yield(double yield) {
		this.m_yield = yield;
	}

	public int yieldRedemptionDate() {
		return m_yieldRedemptionDate;
	}

	public void yieldRedemptionDate(int yieldRedemptionDate) {
		this.m_yieldRedemptionDate = yieldRedemptionDate;
	}
    
}
