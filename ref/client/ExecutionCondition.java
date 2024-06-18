/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectOutput;

public class ExecutionCondition extends OrderCondition {
	
	public static final OrderConditionType conditionType = OrderConditionType.Execution;

    private static final String HEADER = "trade occurs for" + SPACE;
    private static final String SYMBOL_SUFFIX = SPACE + "symbol on" + SPACE;
    private static final String EXCHANGE_SUFFIX = SPACE + "exchange for" + SPACE;
    private static final String SECTYPE_SUFFIX = SPACE + "security type";
	
	protected ExecutionCondition() { }
	
	@Override
	public void readFrom(ObjectInput in) throws IOException{
		super.readFrom(in);
		
		m_secType = in.readUTF();
		m_exchange = in.readUTF();
		m_symbol = in.readUTF();
	}

	@Override
	public String toString() {
		return HEADER + m_symbol + SYMBOL_SUFFIX + m_exchange + EXCHANGE_SUFFIX + m_secType + SECTYPE_SUFFIX + super.toString();
	}

	@Override
	public void writeTo(ObjectOutput out) throws IOException {
		super.writeTo(out);
		
		out.writeUTF(m_secType);
		out.writeUTF(m_exchange);
		out.writeUTF(m_symbol);
	}

	private String m_exchange;
	private String m_secType;
	private String m_symbol;

	public String exchange() {
		return m_exchange;
	}

	public void exchange(String m_exchange) {
		this.m_exchange = m_exchange;
	}

	public String secType() {
		return m_secType;
	}

	public void secType(String m_secType) {
		this.m_secType = m_secType;
	}

	public String symbol() {
		return m_symbol;
	}

	public void symbol(String m_symbol) {
		this.m_symbol = m_symbol;
	} 
	
    @Override public boolean tryToParse(String conditionStr) {
        if (!conditionStr.startsWith(HEADER)) {
            return false;
        }

        try {
            conditionStr = conditionStr.replace(HEADER, EMPTY);
            m_symbol = conditionStr.substring(0, conditionStr.indexOf(SYMBOL_SUFFIX));
            m_exchange = conditionStr.substring(conditionStr.indexOf(SYMBOL_SUFFIX) + SYMBOL_SUFFIX.length(), conditionStr.indexOf(EXCHANGE_SUFFIX));
            m_secType = conditionStr.substring(conditionStr.indexOf(EXCHANGE_SUFFIX) + EXCHANGE_SUFFIX.length(), conditionStr.indexOf(SECTYPE_SUFFIX));
            conditionStr = conditionStr.substring(conditionStr.indexOf(SECTYPE_SUFFIX) + SECTYPE_SUFFIX.length());
            return super.tryToParse(conditionStr);
        }
        catch (Exception ex) {
            return false;
        }
    }
}