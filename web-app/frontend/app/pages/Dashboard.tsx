import React from "react";

import { CustomerDashboard } from "~/components/Dashboard/CustomerDashboard";
import { TrainerDashboard } from "~/components/Dashboard/TrainerDashboard";
import { useAuth } from "~/context/AuthContext";

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div>
        {/* Render different dashboards based on user type */}
        {user?.userType === "user" ? <CustomerDashboard /> : <TrainerDashboard />}
        </div>
    );
};