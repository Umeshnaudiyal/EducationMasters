<xsl:stylesheet
    version="1.0"
    xmlns:html="http://www.w3.org/TR/html40"
    xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
    xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
>
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />

    <xsl:template match="/">
        <xsl:variable name="fileType">
            <xsl:choose>
                <xsl:when test="//channel">RSS</xsl:when>
                <xsl:when test="//sitemap:url">Sitemap</xsl:when>
                <xsl:otherwise>SitemapIndex</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
            <head>
                <title>
                    <xsl:choose>
                        <xsl:when test="$fileType='Sitemap' or $fileType='RSS'">XML Sitemap</xsl:when>
                        <xsl:otherwise>XML Sitemap Index</xsl:otherwise>
                    </xsl:choose>
                </title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <link rel="stylesheet" href="/assets/css/sitemap.css" />
                <style>
                    body { margin: 0; font-size: 68.5%; font-family: Helvetica, Arial, sans-serif; color: #333; background-color: #fff; }
                    .empty-sitemap, table { margin: 20px 40px; width: 75%; }
                    #content-head { padding: 20px 40px; background-color: #141b38; }
                    #content-head a, #content-head h1, #content-head p { color: #fff; font-size: 1.2em; }
                    #content-head h1 { font-size: 2em; margin-top: 0; margin-bottom: 8px; font-weight: 700; }
                    #content-head p { margin: 6px 0; line-height: 1.4; }
                    #content-head a { color: #fff; text-decoration: underline; }
                    table { border: none; font-size: 1em; border-collapse: collapse; }
                    th { padding: 15px 5px; font-size: 14px; text-align: left; border-bottom: 1px solid #ccc; color: #141b38; font-weight: 700; }
                    td { padding: 10px 5px; border-left: 3px solid #fff; font-size: 13px; vertical-align: middle; }
                    tr.stripe { background-color: #f7f7f7; }
                    table td a { color: #0b66c2; text-decoration: none; }
                    table td a:hover { text-decoration: underline; }
                    table td a:not(.localized) { display: block; word-break: break-all; }
                    .item-count { font-weight: 600; color: #333; }
                    .datetime .date { font-weight: 600; color: #222; }
                    .datetime .time { color: #666; font-size: 11px; margin-top: 2px; }
                    .priority { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; text-transform: uppercase; }
                    .priority--high { background-color: #e6f4ea; color: #137333; }
                    .priority--medium { background-color: #fef7e0; color: #b06000; }
                    .priority--low { background-color: #f1f3f4; color: #5f6368; }
                    .breadcrumb { width: 75%; margin: 20px 40px; display: flex; font-size: 12px; align-items: center; font-weight: 600; }
                    .breadcrumb a { color: #141b38; text-decoration: none; }
                    .breadcrumb a:hover { text-decoration: underline; }
                    .breadcrumb span { color: #333; }
                    .breadcrumb svg { margin: 0 10px; }
                    @media (max-width: 1023px) {
                        .empty-sitemap, table, .breadcrumb { width: 92%; margin: 15px 4%; }
                        #content-head { padding: 15px 4%; }
                    }
                </style>
            </head>
            <body>
                <xsl:variable name="amountOfURLs">
                    <xsl:choose>
                        <xsl:when test="$fileType='RSS'">
                            <xsl:value-of select="count(//channel/item)" />
                        </xsl:when>
                        <xsl:when test="$fileType='Sitemap'">
                            <xsl:value-of select="count(sitemap:urlset/sitemap:url)" />
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)" />
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>

                <xsl:call-template name="Header">
                    <xsl:with-param name="title">
                        <xsl:choose>
                            <xsl:when test="$fileType='Sitemap'">XML Sitemap</xsl:when>
                            <xsl:otherwise>XML Sitemap Index</xsl:otherwise>
                        </xsl:choose>
                    </xsl:with-param>
                    <xsl:with-param name="amountOfURLs" select="$amountOfURLs" />
                    <xsl:with-param name="fileType" select="$fileType" />
                </xsl:call-template>

                <div class="content">
                    <div class="container">
                        <xsl:choose>
                            <xsl:when test="$amountOfURLs = 0"><xsl:call-template name="emptySitemap" /></xsl:when>
                            <xsl:when test="$fileType='Sitemap'"><xsl:call-template name="sitemapTable" /></xsl:when>
                            <xsl:otherwise><xsl:call-template name="siteindexTable" /></xsl:otherwise>
                        </xsl:choose>
                    </div>
                </div>
            </body>
        </html>
    </xsl:template>

    <xsl:template name="Header">
        <xsl:param name="title" />
        <xsl:param name="amountOfURLs" />
        <xsl:param name="fileType" />

        <div id="content-head">
            <h1><xsl:value-of select="$title" /></h1>
            <p>
                Generated by
                <a href="https://linkedin.com/in/robintomr" target="_blank" rel="noreferrer noopener">Web Admin</a>,
                this is an XML Sitemap, meant to be consumed by search engines like Google or Bing.
            </p>
            <p>
                You can find more information about XML Sitemaps at 
                <a href="https://www.sitemaps.org/" target="_blank" rel="noreferrer noopener">sitemaps.org</a>
            </p>
            <xsl:if test="$amountOfURLs &gt; 0">
                <p>
                    <xsl:choose>
                        <xsl:when test="$fileType='Sitemap'">
                            This sitemap contains
                            <xsl:value-of select="$amountOfURLs" />
                            <xsl:choose>
                                <xsl:when test="$amountOfURLs = 1"> URL</xsl:when>
                                <xsl:otherwise> URLs</xsl:otherwise>
                            </xsl:choose>
                        </xsl:when>
                        <xsl:otherwise>
                            This sitemap index contains
                            <xsl:value-of select="$amountOfURLs" />
                            <xsl:choose>
                                <xsl:when test="$amountOfURLs = 1"> sitemap</xsl:when>
                                <xsl:otherwise> sitemaps</xsl:otherwise>
                            </xsl:choose>
                        </xsl:otherwise>
                    </xsl:choose>
                    and was generated on October 12, 2026 at 11:06 am
                </p>
            </xsl:if>
        </div>
    </xsl:template>

    <xsl:template name="siteindexTable">
        <div class="breadcrumb">
            <svg class="back" width="6" height="9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.274 7.56L2.22 4.5l3.054-3.06-.94-.94-4 4 4 4 .94-.94z" fill="#141B38" />
            </svg>
            <a href="https://educationmasters.in/">
                <span>Home</span>
            </a>
            <svg width="6" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M.727 7.06L3.78 4 .727.94l.94-.94 4 4-4 4-.94-.94z" fill="#141B38" />
            </svg>
            <span>Sitemap Index</span>
        </div>

        <div class="table-wrapper">
            <table cellpadding="3">
                <thead>
                    <tr>
                        <th class="left">Sitemaps URL</th>
                        <th>URL Count</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                        <tr>
                            <xsl:if test="position() mod 2 != 0">
                                <xsl:attribute name="class">stripe</xsl:attribute>
                            </xsl:if>
                            <td class="left">
                                <a>
                                    <xsl:attribute name="href">
                                        <xsl:value-of select="sitemap:loc" />
                                    </xsl:attribute>
                                    <xsl:value-of select="sitemap:loc" />
                                </a>
                            </td>
                            <td>
                                <div class="item-count">
                                    <xsl:choose>
                                        <xsl:when test="sitemap:count">
                                            <xsl:value-of select="sitemap:count" />
                                        </xsl:when>
                                        <xsl:when test="count">
                                            <xsl:value-of select="count" />
                                        </xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'jobs-sitemap.xml')">1000</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'jobs-sitemap2.xml')">37</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'blogs-sitemap.xml')">1000</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'blogs-sitemap2.xml')">1000</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'blogs-sitemap3.xml')">668</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'pages-sitemap.xml')">18</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'categories-sitemap.xml')">123</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'institutes-sitemap.xml')">625</xsl:when>
                                        <xsl:when test="contains(sitemap:loc, 'departments-sitemap.xml')">62</xsl:when>
                                        <xsl:otherwise>1000</xsl:otherwise>
                                    </xsl:choose>
                                </div>
                            </td>
                            <td class="datetime">
                                <xsl:call-template name="formatDate">
                                    <xsl:with-param name="dateStr" select="sitemap:lastmod" />
                                    <xsl:with-param name="sitemapLoc" select="sitemap:loc" />
                                </xsl:call-template>
                            </td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </div>
    </xsl:template>

    <xsl:template name="sitemapTable">
        <div class="breadcrumb">
            <svg class="back" width="6" height="9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.274 7.56L2.22 4.5l3.054-3.06-.94-.94-4 4 4 4 .94-.94z" fill="#141B38" />
            </svg>
            <a href="https://educationmasters.in/">
                <span>Home</span>
            </a>
            <svg width="6" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M.727 7.06L3.78 4 .727.94l.94-.94 4 4-4 4-.94-.94z" fill="#141B38" />
            </svg>
            <a href="/sitemap.xml/">
                <span>Sitemap Index</span>
            </a>
            <svg width="6" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M.727 7.06L3.78 4 .727.94l.94-.94 4 4-4 4-.94-.94z" fill="#141B38" />
            </svg>
            <span>XML Sitemap</span>
        </div>

        <div class="table-wrapper">
            <table cellpadding="3">
                <thead>
                    <tr>
                        <th class="left">URL</th>
                        <th>Images</th>
                        <th>Change Frequency</th>
                        <th>Priority</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'" />
                    <xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />
                    <xsl:for-each select="sitemap:urlset/sitemap:url">
                        <tr>
                            <xsl:if test="position() mod 2 != 0">
                                <xsl:attribute name="class">stripe</xsl:attribute>
                            </xsl:if>
                            <td class="left">
                                <a href="{sitemap:loc}">
                                    <xsl:value-of select="sitemap:loc" />
                                </a>
                            </td>
                            <td>
                                <div class="item-count">
                                    <xsl:value-of select="count(image:image)" />
                                </div>
                            </td>
                            <td>
                                <xsl:choose>
                                    <xsl:when test="sitemap:changefreq">
                                        <xsl:value-of select="concat(translate(substring(sitemap:changefreq, 1, 1), $lower, $upper), substring(sitemap:changefreq, 2))" />
                                    </xsl:when>
                                    <xsl:otherwise>Daily</xsl:otherwise>
                                </xsl:choose>
                            </td>
                            <td>
                                <xsl:if test="string(number(sitemap:priority))!='NaN'">
                                    <xsl:call-template name="formatPriority">
                                        <xsl:with-param name="priority" select="sitemap:priority" />
                                    </xsl:call-template>
                                </xsl:if>
                            </td>
                            <td class="datetime">
                                <xsl:call-template name="formatDate">
                                    <xsl:with-param name="dateStr" select="sitemap:lastmod" />
                                    <xsl:with-param name="sitemapLoc" select="''" />
                                </xsl:call-template>
                            </td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </div>
    </xsl:template>

    <xsl:template name="formatPriority">
        <xsl:param name="priority" />
        <xsl:variable name="priorityLevel">
            <xsl:choose>
                <xsl:when test="$priority &lt;= 0.5">low</xsl:when>
                <xsl:when test="$priority &gt;= 0.6 and $priority &lt;= 0.8">medium</xsl:when>
                <xsl:when test="$priority &gt;= 0.9">high</xsl:when>
                <xsl:otherwise>medium</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="priorityLabel">
            <xsl:choose>
                <xsl:when test="$priorityLevel = 'low'">Low</xsl:when>
                <xsl:when test="$priorityLevel = 'medium'">Medium</xsl:when>
                <xsl:when test="$priorityLevel = 'high'">High</xsl:when>
            </xsl:choose>
        </xsl:variable>

        <div>
            <xsl:attribute name="class">
                <xsl:value-of select="concat('priority priority--', $priorityLevel)" />
            </xsl:attribute>
            <xsl:value-of select="$priorityLabel" />
        </div>
    </xsl:template>

    <xsl:template name="formatDate">
        <xsl:param name="dateStr" />
        <xsl:param name="sitemapLoc" />

        <xsl:choose>
            <xsl:when test="string-length($dateStr) &gt;= 10 and contains($dateStr, '-')">
                <xsl:variable name="year" select="substring($dateStr, 1, 4)" />
                <xsl:variable name="monthNum" select="substring($dateStr, 6, 2)" />
                <xsl:variable name="day" select="substring($dateStr, 9, 2)" />
                <xsl:variable name="monthName">
                    <xsl:choose>
                        <xsl:when test="$monthNum = '01'">January</xsl:when>
                        <xsl:when test="$monthNum = '02'">February</xsl:when>
                        <xsl:when test="$monthNum = '03'">March</xsl:when>
                        <xsl:when test="$monthNum = '04'">April</xsl:when>
                        <xsl:when test="$monthNum = '05'">May</xsl:when>
                        <xsl:when test="$monthNum = '06'">June</xsl:when>
                        <xsl:when test="$monthNum = '07'">July</xsl:when>
                        <xsl:when test="$monthNum = '08'">August</xsl:when>
                        <xsl:when test="$monthNum = '09'">September</xsl:when>
                        <xsl:when test="$monthNum = '10'">October</xsl:when>
                        <xsl:when test="$monthNum = '11'">November</xsl:when>
                        <xsl:when test="$monthNum = '12'">December</xsl:when>
                        <xsl:otherwise><xsl:value-of select="$monthNum" /></xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
                <div class="date">
                    <xsl:value-of select="concat($monthName, ' ', $day, ', ', $year)" />
                </div>
                <xsl:if test="contains($dateStr, 'T')">
                    <xsl:variable name="timeStr" select="substring-after($dateStr, 'T')" />
                    <xsl:variable name="rawHour" select="number(substring($timeStr, 1, 2))" />
                    <xsl:variable name="min" select="substring($timeStr, 4, 2)" />
                    <xsl:variable name="ampm">
                        <xsl:choose>
                            <xsl:when test="$rawHour &gt;= 12">pm</xsl:when>
                            <xsl:otherwise>am</xsl:otherwise>
                        </xsl:choose>
                    </xsl:variable>
                    <xsl:variable name="displayHour">
                        <xsl:choose>
                            <xsl:when test="$rawHour = 0">12</xsl:when>
                            <xsl:when test="$rawHour &gt; 12 and $rawHour &lt; 22">
                                <xsl:value-of select="concat('0', $rawHour - 12)" />
                            </xsl:when>
                            <xsl:when test="$rawHour &gt;= 22">
                                <xsl:value-of select="$rawHour - 12" />
                            </xsl:when>
                            <xsl:when test="$rawHour &lt; 10">
                                <xsl:value-of select="concat('0', $rawHour)" />
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="$rawHour" />
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:variable>
                    <div class="time">
                        <xsl:value-of select="concat($displayHour, ':', $min, ' ', $ampm)" />
                    </div>
                </xsl:if>
            </xsl:when>
            <xsl:when test="$sitemapLoc != ''">
                <div class="date">
                    <xsl:choose>
                        <xsl:when test="contains($sitemapLoc, 'jobs-sitemap.xml')">September 24, 2026</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'jobs-sitemap2.xml')">October 07, 2026</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'blogs-sitemap.xml')">September 13, 2022</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'blogs-sitemap2.xml')">September 13, 2022</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'blogs-sitemap3.xml')">August 05, 2026</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'pages-sitemap.xml')">September 14, 2022</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'categories-sitemap.xml')">December 12, 2025</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'institutes-sitemap.xml')">October 21, 2022</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'departments-sitemap.xml')">October 09, 2025</xsl:when>
                        <xsl:otherwise>October 12, 2026</xsl:otherwise>
                    </xsl:choose>
                </div>
                <div class="time">
                    <xsl:choose>
                        <xsl:when test="contains($sitemapLoc, 'jobs-sitemap.xml')">01:28 pm</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'jobs-sitemap2.xml')">01:06 pm</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'blogs-sitemap.xml')">11:56 am</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'blogs-sitemap2.xml')">11:56 am</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'blogs-sitemap3.xml')">03:23 pm</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'pages-sitemap.xml')">06:30 pm</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'categories-sitemap.xml')">10:13 am</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'institutes-sitemap.xml')">05:30 pm</xsl:when>
                        <xsl:when test="contains($sitemapLoc, 'departments-sitemap.xml')">12:04 am</xsl:when>
                        <xsl:otherwise>11:06 am</xsl:otherwise>
                    </xsl:choose>
                </div>
            </xsl:when>
            <xsl:otherwise>
                <div class="date"><xsl:value-of select="$dateStr" /></div>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="emptySitemap">
        <div class="breadcrumb">
            <svg class="back" width="6" height="9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.274 7.56L2.22 4.5l3.054-3.06-.94-.94-4 4 4 4 .94-.94z" fill="#141B38" />
            </svg>
            <a href="https://educationmasters.in/">
                <span>Home</span>
            </a>
            <svg width="6" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M.727 7.06L3.78 4 .727.94l.94-.94 4 4-4 4-.94-.94z" fill="#141B38" />
            </svg>
            <span>Sitemap Index</span>
        </div>
        <div class="empty-sitemap">
            <h2 class="empty-sitemap__title">
                Whoops!
                <br />
                There are no records here
            </h2>
            <div class="empty-sitemap__buttons">
                <a href="https://educationmasters.in/" class="button">Back to Homepage</a>
            </div>
        </div>
    </xsl:template>
</xsl:stylesheet>
