import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Pencil, 
  Trash2, 
  X,
  RefreshCw,
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  FileText,
  Menu
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  fetchOrders,
  fetchOrderTrends,
  fetchInventory,
  fetchLowStock,
  restockInventory,
  updateInventoryItem,
  addInventoryItem,
  deleteInventoryItem,
  fetchEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  fetchEmployeePerformance,
  fetchXReport,
  fetchZReport,
  fetchWeeklySalesHistory,
  fetchHourlySalesHistory,
  fetchPeakSalesDays,
  fetchProductUsageReport,
  fetchCustomReport,
  fetchMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from './api';

// ==================== REUSABLE COMPONENTS ====================

const Button = ({ children, className = "", variant = "primary", ...props }) => {
  const baseStyles = "px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-pink-500 hover:bg-pink-600 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-700",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-md p-6 ${className}`}>{children}</div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color = "pink" }) => {
  const colors = {
    pink: "bg-pink-100 text-pink-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {trend && <p className="text-xs text-green-500">{trend}</p>}
      </div>
    </Card>
  );
};

// ==================== TABS ====================

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
      active 
        ? "border-pink-500 text-pink-600" 
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    <Icon className="w-5 h-5" />
    {children}
  </button>
);

// ==================== ORDER TRENDS TAB ====================

const OrderTrendsTab = () => {
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");

  const loadTrends = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrderTrends(startDate, endDate);
      setTrends(data);
    } catch (e) {
      setError("Failed to load order trends. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select Date Range
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <Button onClick={loadTrends} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Loading..." : "Analyze Trends"}
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </Card>

      {trends && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Orders" 
              value={trends.summary.total_orders.toLocaleString()} 
              icon={ShoppingBag}
              color="pink"
            />
            <StatCard 
              title="Total Sales" 
              value={`$${trends.summary.total_sales.toFixed(2)}`} 
              icon={DollarSign}
              color="green"
            />
            <StatCard 
              title="Avg Order Value" 
              value={trends.summary.total_orders > 0 
                ? `$${(trends.summary.total_sales / trends.summary.total_orders).toFixed(2)}` 
                : "$0.00"
              } 
              icon={TrendingUp}
              color="blue"
            />
            <StatCard 
              title="Days Analyzed" 
              value={trends.daily_sales.length} 
              icon={Calendar}
              color="orange"
            />
          </div>

          {/* Top Selling Items */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Selling Items
            </h3>
            {trends.top_items.length > 0 ? (
              <ul className="space-y-3">
                {trends.top_items.map((item, index) => (
                  <li
                    key={item.item_id}
                    className="flex items-center justify-between border border-gray-100 rounded-lg p-3 bg-white shadow-sm hover:border-pink-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Sold: {item.total_sold}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="text-base font-semibold text-green-600">
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data for this period</p>
            )}
          </Card>

          {/* Daily Sales Chart (Simple Bar Representation) */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Sales
            </h3>
            {trends.daily_sales.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {trends.daily_sales.map((day) => {
                  const maxSales = Math.max(...trends.daily_sales.map(d => d.daily_sales));
                  const percentage = maxSales > 0 ? (day.daily_sales / maxSales) * 100 : 0;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-24 flex-shrink-0">{day.date}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div 
                          className="bg-pink-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-20 text-right">
                        ${day.daily_sales.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 w-16 text-right">
                        {day.order_count} orders
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No daily data available</p>
            )}
          </Card>

          {/* Sales by Employee */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sales by Employee
            </h3>
            {trends.sales_by_employee.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Employee</th>
                      <th className="text-right py-2 px-3">Orders</th>
                      <th className="text-right py-2 px-3">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.sales_by_employee.map((emp) => (
                      <tr key={emp.employee_id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{emp.name}</td>
                        <td className="py-2 px-3 text-right">{emp.order_count}</td>
                        <td className="py-2 px-3 text-right text-green-600 font-semibold">
                          ${emp.total_sales.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No employee data for this period</p>
            )}
          </Card>

          {/* Hourly Distribution */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Orders by Hour
            </h3>
            {trends.hourly_distribution.length > 0 ? (
              <div className="flex items-end gap-1 h-40">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourData = trends.hourly_distribution.find(h => h.hour === hour);
                  const count = hourData?.order_count || 0;
                  const maxCount = Math.max(...trends.hourly_distribution.map(h => h.order_count));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-500"
                        style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                        title={`${hour}:00 - ${count} orders`}
                      />
                      {hour % 4 === 0 && (
                        <span className="text-xs text-gray-400 mt-1">{hour}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hourly data available</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

// ==================== INVENTORY TAB ====================

const InventoryTab = () => {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockItems, setRestockItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", stock: 0 });
  const [threshold, setThreshold] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, low] = await Promise.all([
        fetchInventory(),
        fetchLowStock(threshold)
      ]);
      setInventory(inv);
      setLowStock(low);
    } catch (e) {
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [threshold]);

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    try {
      await addInventoryItem(newItem.name, newItem.stock);
      setNewItem({ name: "", stock: 0 });
      setShowAddModal(false);
      loadData();
    } catch (e) {
      setError("Failed to add item");
    }
  };

  const handleUpdateStock = async (ingredientId, newStock) => {
    try {
      await updateInventoryItem(ingredientId, newStock);
      setEditingItem(null);
      loadData();
    } catch (e) {
      setError("Failed to update stock");
    }
  };

  const handleDeleteItem = async (ingredientId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteInventoryItem(ingredientId);
      loadData();
    } catch (e) {
      setError("Failed to delete item");
    }
  };

  const handleRestock = async () => {
    const itemsToRestock = restockItems.filter(item => item.quantity > 0);
    if (itemsToRestock.length === 0) return;
    try {
      await restockInventory(itemsToRestock);
      setRestockItems([]);
      setShowRestockModal(false);
      loadData();
    } catch (e) {
      setError("Failed to restock inventory");
    }
  };

  const openRestockModal = () => {
    setRestockItems(lowStock.map(item => ({
      ingredient_id: item.ingredient_id,
      name: item.name,
      current_stock: item.stock,
      quantity: 0
    })));
    setShowRestockModal(true);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert ({lowStock.length} items)
            </h3>
            <Button onClick={openRestockModal} variant="success">
              <Package className="w-4 h-4" />
              Create Restock Order
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(item => (
              <span 
                key={item.ingredient_id}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.stock <= 0 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {item.name}: {item.stock}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Low Stock Threshold:</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
            className="border border-gray-300 rounded-lg px-3 py-1 w-20"
            min="0"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Ingredient
          </Button>
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          All Inventory ({inventory.length} items)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Ingredient Name</th>
                <th className="text-right py-3 px-4">Stock</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.ingredient_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{item.ingredient_id}</td>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-right">
                    {editingItem === item.ingredient_id ? (
                      <input
                        type="number"
                        defaultValue={item.stock}
                        className="border rounded px-2 py-1 w-20 text-right"
                        onBlur={(e) => handleUpdateStock(item.ingredient_id, parseInt(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateStock(item.ingredient_id, parseInt(e.target.value));
                          } else if (e.key === 'Escape') {
                            setEditingItem(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold">{item.stock}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.stock <= 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Out of Stock
                      </span>
                    ) : item.stock < threshold ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingItem(item.ingredient_id)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        title="Edit Stock"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.ingredient_id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Item Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Ingredient">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Tapioca Pearls (ounces)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
            <input
              type="number"
              value={newItem.stock}
              onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              min="0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add Ingredient</Button>
          </div>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={showRestockModal} onClose={() => setShowRestockModal(false)} title="Create Restock Order">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the quantity to add for each low-stock item:
          </p>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {restockItems.map((item, index) => (
              <div key={item.ingredient_id} className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">Current: {item.current_stock}</p>
                </div>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const updated = [...restockItems];
                    updated[index].quantity = parseInt(e.target.value) || 0;
                    setRestockItems(updated);
                  }}
                  className="border rounded px-2 py-1 w-20 text-right"
                  min="0"
                  placeholder="Qty"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowRestockModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleRestock}>
              <Package className="w-4 h-4" />
              Submit Restock Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== EMPLOYEES TAB ====================

const EmployeesTab = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({ name: "", salary: "", manager_id: 0 });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [performance, setPerformance] = useState(null);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (e) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim()) return;
    try {
      await addEmployee(
        newEmployee.name, 
        newEmployee.salary ? parseFloat(newEmployee.salary) : null,
        newEmployee.manager_id
      );
      setNewEmployee({ name: "", salary: "", manager_id: 0 });
      setShowAddModal(false);
      loadEmployees();
    } catch (e) {
      setError("Failed to add employee");
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    try {
      await updateEmployee(editingEmployee.employee_id, {
        name: editingEmployee.name,
        salary: editingEmployee.salary ? parseFloat(editingEmployee.salary) : null,
        manager_id: editingEmployee.manager_id
      });
      setEditingEmployee(null);
      loadEmployees();
    } catch (e) {
      setError("Failed to update employee");
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(employeeId);
      loadEmployees();
    } catch (e) {
      setError("Failed to delete employee");
    }
  };

  const loadPerformance = async (employee) => {
    setSelectedEmployee(employee);
    try {
      const data = await fetchEmployeePerformance(employee.employee_id);
      setPerformance(data);
    } catch (e) {
      setError("Failed to load performance data");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  // Count managers and employees by role
  const managerCount = employees.filter(e => e.role === 'Manager').length;
  const employeeCount = employees.filter(e => e.role === 'Employee').length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Staff" 
          value={employees.length} 
          icon={Users}
          color="blue"
        />
        <StatCard 
          title="Managers" 
          value={managerCount} 
          icon={Users}
          color="green"
        />
        <StatCard 
          title="Employees" 
          value={employeeCount} 
          icon={Users}
          color="pink"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
        <Button onClick={loadEmployees} variant="secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Employee Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Staff List
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">Hourly Rate</th>
                <th className="text-center py-3 px-4">Role</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.employee_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{emp.employee_id}</td>
                  <td className="py-3 px-4 font-medium">{emp.name}</td>
                  <td className="py-3 px-4 text-right">
                    {emp.salary ? `$${emp.salary.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.role === 'Manager'
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => loadPerformance(emp)}
                        className="p-1 text-green-500 hover:bg-green-50 rounded"
                        title="View Performance"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingEmployee({...emp})}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.employee_id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Employee Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Employee Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
            <input
              type="number"
              value={newEmployee.salary}
              onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., 12.50"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newEmployee.manager_id}
              onChange={(e) => setNewEmployee({ ...newEmployee, manager_id: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={0}>Manager</option>
              <option value={1}>Employee</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee}>Add Employee</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={!!editingEmployee} onClose={() => setEditingEmployee(null)} title="Edit Employee">
        {editingEmployee && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editingEmployee.name}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                value={editingEmployee.salary || ""}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editingEmployee.manager_id}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, manager_id: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value={0}>Manager</option>
                <option value={1}>Employee</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingEmployee(null)}>Cancel</Button>
              <Button onClick={handleUpdateEmployee}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Performance Modal */}
      <Modal 
        isOpen={!!selectedEmployee} 
        onClose={() => { setSelectedEmployee(null); setPerformance(null); }} 
        title={selectedEmployee ? `Performance: ${selectedEmployee.name}` : ""}
      >
        {selectedEmployee && performance && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{performance.total_orders}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">${performance.total_sales.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average per Order</p>
              <p className="text-xl font-bold text-gray-700">
                ${performance.total_orders > 0 
                  ? (performance.total_sales / performance.total_orders).toFixed(2) 
                  : "0.00"}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==================== REPORTS TAB ====================

const ReportsTab = () => {
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customQuery, setCustomQuery] = useState("");

  const loadReport = async (reportType) => {
    setLoading(true);
    setError("");
    setReportData(null);
    setActiveReport(reportType);
    
    try {
      let data;
      switch (reportType) {
        case 'x-report':
          data = await fetchXReport();
          break;
        case 'z-report':
          data = await fetchZReport(selectedDate);
          break;
        case 'weekly-sales':
          data = await fetchWeeklySalesHistory();
          break;
        case 'hourly-sales':
          data = await fetchHourlySalesHistory(selectedDate);
          break;
        case 'peak-sales':
          data = await fetchPeakSalesDays(10);
          break;
        case 'product-usage':
          data = await fetchProductUsageReport(startDate, endDate);
          break;
        default:
          break;
      }
      setReportData(data);
    } catch (e) {
      setError(`Failed to load ${reportType}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeCustomReport = async () => {
    if (!customQuery.trim()) {
      setError("Please enter a SQL query");
      return;
    }
    setLoading(true);
    setError("");
    setReportData(null);
    setActiveReport('custom');
    
    try {
      const data = await fetchCustomReport(customQuery);
      setReportData(data);
    } catch (e) {
      setError(`Failed to execute custom report: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Report Selection Grid */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Select a Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button
            onClick={() => loadReport('x-report')}
            variant={activeReport === 'x-report' ? 'primary' : 'secondary'}
            className="w-full"
          >
            <FileText className="w-4 h-4" />
            X-Report (Today's Hourly)
          </Button>
          <Button
            onClick={() => loadReport('z-report')}
            variant={activeReport === 'z-report' ? 'primary' : 'secondary'}
            className="w-full"
          >
            <FileText className="w-4 h-4" />
            Z-Report (End of Day)
          </Button>
          <Button
            onClick={() => loadReport('weekly-sales')}
            variant={activeReport === 'weekly-sales' ? 'primary' : 'secondary'}
            className="w-full"
          >
            <Calendar className="w-4 h-4" />
            Weekly Sales History
          </Button>
          <Button
            onClick={() => loadReport('hourly-sales')}
            variant={activeReport === 'hourly-sales' ? 'primary' : 'secondary'}
            className="w-full"
          >
            <Clock className="w-4 h-4" />
            Hourly Sales History
          </Button>
          <Button
            onClick={() => loadReport('peak-sales')}
            variant={activeReport === 'peak-sales' ? 'primary' : 'secondary'}
            className="w-full"
          >
            <TrendingUp className="w-4 h-4" />
            Top 10 Peak Sales Days
          </Button>
          <Button
            onClick={() => loadReport('product-usage')}
            variant={activeReport === 'product-usage' ? 'primary' : 'secondary'}
            className="w-full"
          >
            <Package className="w-4 h-4" />
            Product Usage Report
          </Button>
        </div>
      </Card>

      {/* Date/Range Selectors for specific reports */}
      {(activeReport === 'z-report' || activeReport === 'hourly-sales') && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Select Date</h3>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <Button onClick={() => loadReport(activeReport)}>
              <RefreshCw className="w-4 h-4" />
              Refresh Report
            </Button>
          </div>
        </Card>
      )}

      {activeReport === 'product-usage' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <Button onClick={() => loadReport('product-usage')}>
              <RefreshCw className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </Card>
      )}

      {/* Custom Report Section */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Custom SQL Report</h3>
        <div className="space-y-3">
          <textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
            rows="4"
          />
          <Button onClick={executeCustomReport}>
            <FileText className="w-4 h-4" />
            Execute Custom Report
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}

      {/* Report Results */}
      {!loading && reportData && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {activeReport === 'x-report' && "X-Report - Today's Hourly Sales"}
              {activeReport === 'z-report' && `Z-Report - End of Day (${selectedDate})`}
              {activeReport === 'weekly-sales' && "Weekly Sales History"}
              {activeReport === 'hourly-sales' && `Hourly Sales History (${selectedDate})`}
              {activeReport === 'peak-sales' && "Top 10 Peak Sales Days"}
              {activeReport === 'product-usage' && "Product Usage Report"}
              {activeReport === 'custom' && "Custom Report Results"}
            </h3>
            <Button
              variant="secondary"
              onClick={() => {
                const dataStr = JSON.stringify(reportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${activeReport}-${new Date().toISOString()}.json`;
                link.click();
              }}
            >
              Export JSON
            </Button>
          </div>

          {/* Display report based on type */}
          <div className="overflow-x-auto">
            {Array.isArray(reportData) ? (
              reportData.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-semibold">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        {Object.values(row).map((val, valIdx) => (
                          <td key={valIdx} className="py-2 px-3">
                            {typeof val === 'number' && !Number.isInteger(val)
                              ? val.toFixed(2)
                              : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available for this report</p>
              )
            ) : (
              <div className="space-y-2">
                {Object.entries(reportData).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">{key.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="text-gray-700">
                      {typeof value === 'number' && !Number.isInteger(value)
                        ? value.toFixed(2)
                        : typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== MENU MANAGEMENT TAB ====================

const MenuManagementTab = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", is_topping: false });

  const loadMenu = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMenu();
      setMenuItems(data);
    } catch (e) {
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.price) {
      setError("Name and price are required");
      return;
    }
    try {
      await addMenuItem(newItem.name, parseFloat(newItem.price), newItem.is_topping);
      setNewItem({ name: "", price: "", is_topping: false });
      setShowAddModal(false);
      loadMenu();
    } catch (e) {
      setError("Failed to add menu item");
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name.trim() || !editingItem.price) {
      setError("Name and price are required");
      return;
    }
    try {
      await updateMenuItem(editingItem.id, {
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        is_topping: editingItem.isTopping
      });
      setEditingItem(null);
      loadMenu();
    } catch (e) {
      setError("Failed to update menu item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await deleteMenuItem(itemId);
      loadMenu();
    } catch (e) {
      setError("Failed to delete menu item");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  // Separate drinks and toppings
  const drinks = menuItems.filter(item => !item.isTopping);
  const toppings = menuItems.filter(item => item.isTopping);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Items" 
          value={menuItems.length} 
          icon={Menu}
          color="pink"
        />
        <StatCard 
          title="Drinks" 
          value={drinks.length} 
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard 
          title="Toppings" 
          value={toppings.length} 
          icon={Package}
          color="orange"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Menu Item
        </Button>
        <Button onClick={loadMenu} variant="secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Drinks Section */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Drinks ({drinks.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drinks.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{item.id}</td>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-semibold">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingItem({...item})}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Toppings Section */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Toppings ({toppings.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {toppings.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{item.id}</td>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-semibold">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingItem({...item})}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Item Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Menu Item">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Classic Milk Tea"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., 5.99"
              step="0.01"
              min="0"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newIsTopping"
              checked={newItem.is_topping}
              onChange={(e) => setNewItem({ ...newItem, is_topping: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="newIsTopping" className="text-sm font-medium text-gray-700">
              This is a topping/add-on
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Menu Item">
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                value={editingItem.price}
                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                step="0.01"
                min="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsTopping"
                checked={editingItem.isTopping}
                onChange={(e) => setEditingItem({ ...editingItem, isTopping: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="editIsTopping" className="text-sm font-medium text-gray-700">
                This is a topping/add-on
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button onClick={handleUpdateItem}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==================== MAIN MANAGER PAGE ====================

function ManagerPage() {
  const [activeTab, setActiveTab] = useState('trends');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Analyze sales trends, manage inventory, and oversee employees
          </p>
        </header>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <TabButton 
              active={activeTab === 'trends'} 
              onClick={() => setActiveTab('trends')}
              icon={BarChart3}
            >
              Order Trends
            </TabButton>
            <TabButton 
              active={activeTab === 'inventory'} 
              onClick={() => setActiveTab('inventory')}
              icon={Package}
            >
              Inventory
            </TabButton>
            <TabButton 
              active={activeTab === 'employees'} 
              onClick={() => setActiveTab('employees')}
              icon={Users}
            >
              Employees
            </TabButton>
            <TabButton 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')}
              icon={FileText}
            >
              Reports
            </TabButton>
            <TabButton 
              active={activeTab === 'menu'} 
              onClick={() => setActiveTab('menu')}
              icon={Menu}
            >
              Menu Management
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'trends' && <OrderTrendsTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'employees' && <EmployeesTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'menu' && <MenuManagementTab />}
        </motion.div>
      </div>
    </div>
  );
}

export default ManagerPage;
