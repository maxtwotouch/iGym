import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { CustomerDashboard } from "~/components/Dashboard/CustomerDashboard";
import { TrainerDashboard } from "~/components/Dashboard/TrainerDashboard";

type Props = {
    userType: string;
}

export const Dashboard: React.FC<Props> = ({
    userType
}) => {
    const navigate = useNavigate();

    if (!userType) {
        navigate("/login");
        return null;
    }

    return (
        <div>
        {userType === "user" ? <CustomerDashboard /> : <TrainerDashboard />}
        </div>
    );
};