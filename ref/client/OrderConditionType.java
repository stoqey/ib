/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public enum OrderConditionType {
	Price(1),
	Time(3),
	Margin(4),
	Execution(5),
	Volume(6),
	PercentChange(7);
	
	private int m_val;
	
	OrderConditionType(int v) {
		m_val = v;
	}
	
	public int val() {
		return m_val;
	}
	
	public static OrderConditionType fromInt(int n) {
		for (OrderConditionType i : OrderConditionType.values())
			if (i.val() == n)
				return i;

		throw new IllegalArgumentException("Error: " + n + " is not a valid value for enum OrderConditionType");
	}

	public static OrderConditionType fromString(String s) {
	    for (OrderConditionType i : OrderConditionType.values())
	        if (i.name().equalsIgnoreCase(s))
	            return i;

	    throw new RuntimeException("Invalid order condition type: " + s);
	}
}