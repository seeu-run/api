import { prisma } from "@/lib/prisma";

export async function getVpsMonitors() {
    const now = new Date();
    const vpsMonitorsToCheck = await prisma.serviceMonitor.findMany({
        where: { type: "VPS" },
        include: {
            organization: {
                include: {
                    Subscription: {
                        include: {
                            plan: {
                                select: { checkInterval: true },
                            },
                        },
                    },
                },
            },
            statuses: {
                orderBy: { checkedAt: "desc" },
                take: 1,
                select: { checkedAt: true, id: true },
            },
        },
    });

    return vpsMonitorsToCheck.filter((monitor) => {
        const lastStatus = monitor.statuses[0];
        if (!lastStatus) return false;

        const lastCheckedAt = new Date(lastStatus.checkedAt);
        const timeDifferenceInMinutes = Math.floor((now.getTime() - lastCheckedAt.getTime()) / (1000 * 60));

        // ✅ Garante que `Subscription` existe e não está vazio
        if (!monitor.organization.Subscription.length) {
            console.warn(`⚠️ Monitor ${monitor.id} não tem uma Subscription válida.`);
            return false;
        }

        return timeDifferenceInMinutes >= monitor.organization.Subscription[0].plan.checkInterval;
    });
}
