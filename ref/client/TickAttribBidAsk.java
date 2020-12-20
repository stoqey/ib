/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class TickAttribBidAsk {
	private boolean m_bidPastLow = false;
	private boolean m_askPastHigh = false;
	
	public boolean bidPastLow() {
		return m_bidPastLow;
	}
	public boolean askPastHigh() {
		return m_askPastHigh;
	}
	public void bidPastLow(boolean bidPastLow) {
		this.m_bidPastLow = bidPastLow;
	}
	public void askPastHigh(boolean askPastHigh) {
		this.m_askPastHigh = askPastHigh;
	}
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append(m_bidPastLow ? "bidPastLow " : "");
		sb.append(m_askPastHigh ? "askPastHigh " : "");
		return sb.toString();
	}
}
