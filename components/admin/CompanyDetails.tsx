import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { User, Order, OrderStatus } from "../../types";
import { Card, Button, Badge } from "../ui/Shared";

interface CompanyDetailsProps {
  company: User;
  orders: Order[];
  onBack: () => void;
  onViewOrder: (order: Order) => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  orders,
  onBack,
  onViewOrder,
}) => {
  const { t } = useTranslation();

  // Filter orders for this company
  const companyOrders = useMemo(() => {
    return orders.filter((order) => order.restaurantId === company.id);
  }, [orders, company.id]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.OUT_FOR_DELIVERY,
    ];

    const activeOrders = companyOrders.filter((o) =>
      activeStatuses.includes(o.status)
    );
    const completedOrders = companyOrders.filter(
      (o) => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED
    );

    const totalRevenue = companyOrders.reduce(
      (sum, o) => sum + (o.totalCost || 0),
      0
    );
    const totalProfit = companyOrders.reduce(
      (sum, o) => sum + (o.totalProfit || 0),
      0
    );

    const avgOrderValue = companyOrders.length > 0
      ? totalRevenue / companyOrders.length
      : 0;

    return {
      totalOrders: companyOrders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      totalProfit,
      avgOrderValue,
    };
  }, [companyOrders]);

  // Get recent orders (last 10)
  const recentOrders = useMemo(() => {
    return [...companyOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [companyOrders]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "warning";
      case OrderStatus.CONFIRMED:
        return "info";
      case OrderStatus.OUT_FOR_DELIVERY:
        return "info";
      case OrderStatus.DELIVERED:
        return "success";
      case OrderStatus.COMPLETED:
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ka-GE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPreferredTimeLabel = (time?: string) => {
    switch (time) {
      case "morning":
        return t("settings.time_morning");
      case "afternoon":
        return t("settings.time_afternoon");
      case "evening":
        return t("settings.time_evening");
      case "any":
        return t("settings.time_any");
      default:
        return "-";
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case "cash":
        return t("settings.payment_cash");
      case "transfer":
        return t("settings.payment_transfer");
      case "both":
        return t("settings.payment_both");
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← {t("common.back")}
        </Button>
        <div className="flex items-center gap-3">
          {company.avatar ? (
            <img
              src={company.avatar}
              alt={company.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {company.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {company.name}
            </h1>
            <Badge variant={company.isActive ? "success" : "destructive"}>
              {company.isActive ? t("users.active") : t("users.inactive")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalOrders}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("companyDetails.totalOrders")}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.activeOrders}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("companyDetails.activeOrders")}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.completedOrders}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("companyDetails.completedOrders")}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalRevenue.toFixed(2)}₾
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("companyDetails.totalRevenue")}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.totalProfit.toFixed(2)}₾
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("companyDetails.totalProfit")}
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.avgOrderValue.toFixed(2)}₾
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("companyDetails.avgOrderValue")}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("companyDetails.companyInfo")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t("common.email")}:
              </span>
              <span className="text-gray-900 dark:text-white">{company.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t("users.phone")}:
              </span>
              <span className="text-gray-900 dark:text-white">
                {company.phone ? (
                  <a href={`tel:${company.phone}`} className="text-primary-600 hover:underline">
                    {company.phone}
                  </a>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t("settings.address")}:
              </span>
              <span className="text-gray-900 dark:text-white text-right max-w-[200px]">
                {company.address || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t("settings.working_hours")}:
              </span>
              <span className="text-gray-900 dark:text-white">
                {company.workingHours || "-"}
              </span>
            </div>
            {company.locationLink && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("restaurant.location_label")}:
                </span>
                <a
                  href={company.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {t("companyDetails.viewOnMap")}
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("companyDetails.preferences")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t("settings.preferred_time")}:
              </span>
              <span className="text-gray-900 dark:text-white">
                {getPreferredTimeLabel(company.preferredDeliveryTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t("settings.payment_method")}:
              </span>
              <span className="text-gray-900 dark:text-white">
                {getPaymentMethodLabel(company.paymentMethod)}
              </span>
            </div>
            {company.defaultDriverNote && (
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">
                  {t("settings.default_driver_note")}:
                </span>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                  {company.defaultDriverNote}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("companyDetails.recentOrders")}
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {t("companyDetails.noOrders")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {t("orders.orderId")}
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {t("orders.date")}
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {t("orders.items")}
                  </th>
                  <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {t("orders.status")}
                  </th>
                  <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {t("orders.total")}
                  </th>
                  <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {t("orders.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-2 px-3 text-gray-900 dark:text-white font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                      {order.items.length} {t("orders.items")}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-900 dark:text-white font-medium">
                      {order.totalCost ? `${order.totalCost.toFixed(2)}₾` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                      >
                        {t("common.view")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
