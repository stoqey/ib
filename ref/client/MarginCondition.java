/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class MarginCondition extends OperatorCondition {
	
	public static final OrderConditionType conditionType = OrderConditionType.Margin;

    private static final String HEADER = "the margin cushion percent";
	
	protected MarginCondition() { }
	
	@Override
	public String toString() {		
		return HEADER + super.toString();
	}

	private int m_percent;

	public int percent() {
		return m_percent;
	}

	public void percent(int m_percent) {
		this.m_percent = m_percent;
	}

	@Override
	protected String valueToString() {
		return Util.IntMaxString(m_percent);
	}

	@Override
	protected void valueFromString(String v) {
		m_percent = Integer.parseInt(v);
	}
	
    @Override public boolean tryToParse(String conditionStr) {
        if (!conditionStr.startsWith(HEADER)) {
            return false;
        }
        conditionStr = conditionStr.replace(HEADER, EMPTY);
        return super.tryToParse(conditionStr);
    }
}