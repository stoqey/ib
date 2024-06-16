/* Copyright (C) 2023 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.util.Arrays;
import java.util.List;

public enum OrderType implements IApiEnum {
	None( Arrays.asList("") ),
	MKT( Arrays.asList("MKT", "MARKET") ),
	LMT( Arrays.asList("LMT", "LIMIT") ),
	STP( Arrays.asList("STP", "STOP") ),
	STP_LMT( Arrays.asList("STP LMT", "STOP LIMIT", "STOPLIMIT", "STOPLMT", "STPLMT") ),
	REL( Arrays.asList("REL", "RELATIVE") ),
	TRAIL( Arrays.asList("TRAIL", "TRAILING STOP") ),
	BOX_TOP( Arrays.asList("BOX TOP", "BOXTOP","BOX_TOP") ),
	FIX_PEGGED( Arrays.asList("FIX PEGGED", "FIXPEGGED") ),
	LIT( Arrays.asList("LIT") ),
	LMT_PLUS_MKT( Arrays.asList("LMT + MKT", "LMT+MKT") ),
	LOC( Arrays.asList("LOC", "LMT CLS", "LMTCLS") ),
	MIDPRICE( Arrays.asList("MIDPRICE") ),
	MIT( Arrays.asList("MIT") ),
	MKT_PRT( Arrays.asList("MKT PRT", "MKTPRT") ),
	MOC( Arrays.asList("MOC", "MKT CLS","MKTCLS") ),
	MTL( Arrays.asList("MTL", "MKT TO LMT", "MKTTOLMT") ),
	PASSV_REL( Arrays.asList("PASSV REL") ),
	PEG_BENCH( Arrays.asList("PEG BENCH", "PEGBENCH") ),
	PEG_BEST( Arrays.asList("PEG BEST", "PEGBEST") ),
	PEG_MID( Arrays.asList("PEG MID", "PEGMID") ),
	PEG_MKT( Arrays.asList("PEG MKT","PEGMKT") ),
	PEG_PRIM( Arrays.asList("PEG PRIM", "PEGPRIM") ), // ?
	PEG_STK( Arrays.asList("PEG STK", "PEGSTK") ),
	REL_PLUS_LMT( Arrays.asList("REL + LMT", "REL+LMT") ),
	REL_PLUS_MKT( Arrays.asList("REL + MKT", "REL+MKT") ),
	SNAP_MID( Arrays.asList("SNAP MID","SNAPMID") ),
	SNAP_MKT( Arrays.asList("SNAP MKT", "SNAPMKT") ),
	SNAP_PRIM( Arrays.asList("SNAP PRIM", "SNAPPRIM") ),
	STP_PRT( Arrays.asList("STP PRT", "STOP PROTECT") ),
	TRAIL_LIMIT( Arrays.asList("TRAIL LIMIT", "TRAILLMT", "TRAILLIMIT") ),
	TRAIL_LIT( Arrays.asList("TRAIL LIT", "TRAILLIT") ),
	TRAIL_LMT_PLUS_MKT( Arrays.asList("TRAIL LMT + MKT") ),
	TRAIL_MIT( Arrays.asList("TRAIL MIT", "TRAILMIT") ),
	TRAIL_REL_PLUS_MKT( Arrays.asList("TRAIL REL + MKT") ),
	VOL( Arrays.asList("VOL", "VOLATILITY","VOLAT") ),
	VWAP( Arrays.asList("VWAP") ),
	QUOTE( Arrays.asList("QUOTE") ),
	PEG_PRIM_VOL( Arrays.asList("PPV", "PEG PRM VOL","PEGPRIMVOL") ),
	PEG_MID_VOL( Arrays.asList("PDV", "PEG MID VOL", "PEGMIDVOL") ),
	PEG_MKT_VOL( Arrays.asList("PMV", "PEG MKT VOL","PEGMKTVOL") ),
	PEG_SRF_VOL( Arrays.asList("PSV", "PEG SURF VOL","PEGSURFVOL") ); 

	private List<String> m_apiStrings;

	OrderType(List<String> apiStrings) {
		m_apiStrings = apiStrings;
	}

	public static OrderType get(String apiString) {
		if (apiString != null && apiString.length() > 0 && !apiString.equals( "None") ) {
			for (OrderType type : values() ) {
				if (type.m_apiStrings.contains(apiString)) {
					return type;
				}
			}
		}
		return None;
	}

	@Override public String toString() {
		return this == None ? super.toString() : m_apiStrings.get(0);
	}

	@Override public String getApiString() {
		return m_apiStrings.get(0);
	}

}
