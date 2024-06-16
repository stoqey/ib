/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class TimeCondition extends OperatorCondition {
	
	public static final OrderConditionType conditionType = OrderConditionType.Time;

    private static final String HEADER = "time";

	protected TimeCondition() { }
	
	@Override
	public String toString() {
		return HEADER + super.toString();
	}

	private String m_time;

	public String time() {
		return m_time;
	}

	public void time(String m_time) {
		this.m_time = m_time;
	}

	@Override
	protected String valueToString() {
		return m_time;
	}

	@Override
	protected void valueFromString(String v) {
		m_time = v;
	}
	
    @Override public boolean tryToParse(String conditionStr) {
        if (!conditionStr.startsWith(HEADER))
            return false;
        conditionStr = conditionStr.replace(HEADER, EMPTY);
        return super.tryToParse(conditionStr);
    }
}