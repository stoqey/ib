/* Copyright (C) 2022 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class WshEventData {

    private int m_conId;
    private String m_filter;
    private boolean m_fillWatchlist;
    private boolean m_fillPortfolio;
    private boolean m_fillCompetitors;
    private String m_startDate;
    private String m_endDate;
    private int m_totalLimit;

    public int conId() { return m_conId; }
    public String filter() { return m_filter; }
    public boolean fillWatchlist() { return m_fillWatchlist; }
    public boolean fillPortfolio() { return m_fillPortfolio; }
    public boolean fillCompetitors() { return m_fillCompetitors; }
    public String startDate() { return m_startDate; }
    public String endDate() { return m_endDate; }
    public int totalLimit() { return m_totalLimit; }

    public WshEventData(int conId, boolean fillWatchlist, boolean fillPortfolio, boolean fillCompetitors,
            String startDate, String endDate, int totalLimit) {
        m_conId = conId;
        m_filter = "";
        m_fillWatchlist = fillWatchlist;
        m_fillPortfolio = fillPortfolio;
        m_fillCompetitors = fillCompetitors;
        m_startDate = startDate;
        m_endDate = endDate;
        m_totalLimit = totalLimit;
    }

    public WshEventData(String filter, boolean fillWatchlist, boolean fillPortfolio, boolean fillCompetitors,
            String startDate, String endDate, int totalLimit) {
        m_conId = Integer.MAX_VALUE;
        m_filter = filter;
        m_fillWatchlist = fillWatchlist;
        m_fillPortfolio = fillPortfolio;
        m_fillCompetitors = fillCompetitors;
        m_startDate = startDate;
        m_endDate = endDate;
        m_totalLimit = totalLimit;
    }

}
