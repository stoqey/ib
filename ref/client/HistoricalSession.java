/* Copyright (C) 2021 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class HistoricalSession {
    private String m_startDateTime;
    private String m_endDateTime;
    private String m_refDate;

    public HistoricalSession(String startDateTime, String endDateTime, String refDate) {
        m_startDateTime = startDateTime;
        m_endDateTime = endDateTime;
        m_refDate = refDate;
    }

    public String startDateTime() {
        return m_startDateTime;
    }

    public String endDateTime() {
        return m_endDateTime;
    }

    public String refDate() {
        return m_refDate;
    }
}