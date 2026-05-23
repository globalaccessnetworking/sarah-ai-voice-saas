"use client";

import React from 'react';
import OnboardingBanner from "../OnboardingBanner";
import KPIGrid from "../KPIGrid";
import AnalyticsVisualizations from "../AnalyticsVisualizations";

export default function OverviewTab() {
    return (
        <div className="space-y-12">
            <OnboardingBanner />
            <KPIGrid />
            <AnalyticsVisualizations />
        </div>
    );
}
