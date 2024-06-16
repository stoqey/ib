/* Copyright (C) 2024 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectOutput;
import java.util.List;

public abstract class ContractCondition extends OperatorCondition {

    private static final String OF = SPACE + "of" + SPACE;
    private static final String ON = SPACE + "on" + SPACE;
    private static final String LEFT_PARENTHESIS = "(";
    private static final String RIGHT_PARENTHESIS = ")";
	
	@Override
	public String toString() {
		return toString(null);
	}
	
	public String toString(ContractLookuper lookuper) {
		Contract c = new Contract();
		
		c.conid(conId());
		c.exchange(exchange());
		
		List<ContractDetails> list = lookuper == null ? null : lookuper.lookupContract(c);		
		String strContract = list != null && !list.isEmpty() ? 
				list.get(0).contract().symbol() + SPACE + list.get(0).contract().secType() + ON + list.get(0).contract().exchange() :
				conId() + LEFT_PARENTHESIS + exchange() + RIGHT_PARENTHESIS;
		
		return type() + OF + strContract + super.toString();
	}

	private int m_conId;
	private String m_exchange;

	@Override
	public void readFrom(ObjectInput in) throws IOException {
		super.readFrom(in);
		
		m_conId = in.readInt();
		m_exchange = in.readUTF();
	}

	@Override
	public void writeTo(ObjectOutput out) throws IOException {
		super.writeTo(out);
		out.writeInt(m_conId);
		out.writeUTF(m_exchange);
	}

	public int conId() {
		return m_conId;
	}

	public void conId(int m_conId) {
		this.m_conId = m_conId;
	}

	public String exchange() {
		return m_exchange;
	}

	public void exchange(String exchange) {
		this.m_exchange = exchange;
	}
	
	@Override public boolean tryToParse(String conditionStr) {
        try
        {
            if (!conditionStr.substring(0, conditionStr.indexOf(OF)).equals(type().name())) {
                return false;
            }
            conditionStr = conditionStr.substring(conditionStr.indexOf(OF) + OF.length());
            m_conId = Integer.parseInt(conditionStr.substring(0, conditionStr.indexOf(LEFT_PARENTHESIS)));
            conditionStr = conditionStr.substring(conditionStr.indexOf(LEFT_PARENTHESIS) + 1);
            m_exchange = conditionStr.substring(0, conditionStr.indexOf(RIGHT_PARENTHESIS));
            conditionStr = conditionStr.substring(conditionStr.indexOf(RIGHT_PARENTHESIS) + 1);
            return super.tryToParse(conditionStr);
        }
        catch (Exception ex)
        {
            return false;
        }
    }
}