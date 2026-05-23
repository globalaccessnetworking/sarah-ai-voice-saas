import Sidebar from "@/components/Sidebar";
import SMSHealthMonitor from "@/components/SMSHealthMonitor";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
