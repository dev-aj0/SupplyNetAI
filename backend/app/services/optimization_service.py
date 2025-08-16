import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime, timedelta
from scipy import stats
from app.services.forecasting_service import ForecastingService

logger = logging.getLogger(__name__)


class StockOptimizationService:
    def __init__(self, forecasting_service: ForecastingService):
        self.forecasting_service = forecasting_service
        self.safety_stock_multiplier = 1.5  # Z-score for 93% service level
        self.min_order_qty = 10
        self.max_order_qty = 1000
        self.lot_size_multiplier = 1.0  # For lot size constraints
        
    def calculate_stock_recommendations(self, sales_data: List[Dict], warehouse_id: str, sku_id: str) -> Dict:
        """Calculate comprehensive stock recommendations for a warehouse-SKU combination"""
        try:
            df = pd.DataFrame(sales_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            if len(df) < 7:
                return {
                    "status": "error",
                    "error": "Insufficient data for stock optimization"
                }
            
            # Calculate demand statistics
            demand_stats = self._calculate_demand_statistics(df)
            
            # Get current stock level (simulate from recent data)
            current_stock = self._estimate_current_stock(df, warehouse_id, sku_id)
            
            # Calculate lead time (simulate based on historical patterns)
            lead_time_days = self._estimate_lead_time(df, warehouse_id, sku_id)
            
            # Calculate safety stock
            safety_stock = self._calculate_safety_stock(demand_stats, lead_time_days)
            
            # Calculate reorder point
            reorder_point = self._calculate_reorder_point(demand_stats, safety_stock, lead_time_days)
            
            # Calculate target stock level
            target_stock = self._calculate_target_stock(demand_stats, safety_stock, lead_time_days)
            
            # Calculate recommended order quantity
            recommended_order_qty = self._calculate_order_quantity(
                current_stock, target_stock, demand_stats
            )
            
            # Determine stock status
            status = self._determine_stock_status(current_stock, safety_stock, reorder_point)
            
            # Calculate additional metrics
            stockout_risk = self._calculate_stockout_risk(current_stock, reorder_point, demand_stats)
            excess_inventory_cost = self._calculate_excess_inventory_cost(
                current_stock, target_stock, demand_stats
            )
            
            return {
                "status": "success",
                "warehouse_id": warehouse_id,
                "sku_id": sku_id,
                "current_stock": current_stock,
                "safety_stock": safety_stock,
                "reorder_point": reorder_point,
                "target_stock": target_stock,
                "recommended_order_qty": recommended_order_qty,
                "lead_time_days": lead_time_days,
                "status": status,
                "stockout_risk": stockout_risk,
                "excess_inventory_cost": excess_inventory_cost,
                "demand_statistics": demand_stats,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error calculating stock recommendations for {warehouse_id}-{sku_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _calculate_demand_statistics(self, df: pd.DataFrame) -> Dict:
        """Calculate comprehensive demand statistics"""
        daily_demand = df.groupby('date')['units_sold'].sum()
        
        # Basic statistics
        mean_demand = daily_demand.mean()
        std_demand = daily_demand.std()
        median_demand = daily_demand.median()
        
        # Percentiles for robust statistics
        p95_demand = daily_demand.quantile(0.95)
        p99_demand = daily_demand.quantile(0.99)
        
        # Trend analysis
        trend = self._calculate_demand_trend(daily_demand)
        
        # Seasonality detection
        seasonality = self._detect_seasonality(daily_demand)
        
        # Volatility (coefficient of variation)
        cv = std_demand / mean_demand if mean_demand > 0 else 0
        
        return {
            "mean_daily_demand": round(mean_demand, 2),
            "std_daily_demand": round(std_demand, 2),
            "median_daily_demand": round(median_demand, 2),
            "p95_daily_demand": round(p95_demand, 2),
            "p99_daily_demand": round(p99_demand, 2),
            "trend": trend,
            "seasonality": seasonality,
            "coefficient_of_variation": round(cv, 3),
            "total_days": len(daily_demand),
            "total_demand": int(daily_demand.sum())
        }
    
    def _calculate_demand_trend(self, daily_demand: pd.Series) -> Dict:
        """Calculate demand trend using linear regression"""
        try:
            if len(daily_demand) < 7:
                return {"slope": 0, "trend_direction": "stable", "trend_strength": "weak"}
            
            x = np.arange(len(daily_demand))
            y = daily_demand.values
            
            if len(y) > 1 and not np.all(y == y[0]):
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
                
                # Determine trend direction and strength
                if abs(slope) < 0.1:
                    direction = "stable"
                elif slope > 0:
                    direction = "increasing"
                else:
                    direction = "decreasing"
                
                if abs(r_value) > 0.7:
                    strength = "strong"
                elif abs(r_value) > 0.4:
                    strength = "moderate"
                else:
                    strength = "weak"
                
                return {
                    "slope": round(slope, 4),
                    "intercept": round(intercept, 2),
                    "r_squared": round(r_value**2, 3),
                    "p_value": round(p_value, 4),
                    "trend_direction": direction,
                    "trend_strength": strength
                }
            else:
                return {"slope": 0, "trend_direction": "stable", "trend_strength": "weak"}
                
        except Exception as e:
            logger.warning(f"Error calculating demand trend: {str(e)}")
            return {"slope": 0, "trend_direction": "stable", "trend_strength": "weak"}
    
    def _detect_seasonality(self, daily_demand: pd.Series) -> Dict:
        """Detect weekly and monthly seasonality"""
        try:
            if len(daily_demand) < 28:
                return {"weekly_pattern": "insufficient_data", "monthly_pattern": "insufficient_data"}
            
            # Weekly seasonality
            weekly_pattern = "none"
            if len(daily_demand) >= 7:
                weekly_means = []
                for day in range(7):
                    day_data = daily_demand[daily_demand.index.dayofweek == day]
                    if len(day_data) > 0:
                        weekly_means.append(day_data.mean())
                
                if len(weekly_means) >= 7:
                    weekly_cv = np.std(weekly_means) / np.mean(weekly_means)
                    if weekly_cv > 0.2:
                        weekly_pattern = "strong"
                    elif weekly_cv > 0.1:
                        weekly_pattern = "moderate"
                    else:
                        weekly_pattern = "weak"
            
            # Monthly seasonality
            monthly_pattern = "none"
            if len(daily_demand) >= 90:
                monthly_means = []
                for month in range(1, 13):
                    month_data = daily_demand[daily_demand.index.month == month]
                    if len(month_data) > 0:
                        monthly_means.append(month_data.mean())
                
                if len(monthly_means) >= 12:
                    monthly_cv = np.std(monthly_means) / np.mean(monthly_means)
                    if monthly_cv > 0.3:
                        monthly_pattern = "strong"
                    elif monthly_cv > 0.15:
                        monthly_pattern = "moderate"
                    else:
                        monthly_pattern = "weak"
            
            return {
                "weekly_pattern": weekly_pattern,
                "monthly_pattern": monthly_pattern
            }
            
        except Exception as e:
            logger.warning(f"Error detecting seasonality: {str(e)}")
            return {"weekly_pattern": "error", "monthly_pattern": "error"}
    
    def _estimate_current_stock(self, df: pd.DataFrame, warehouse_id: str, sku_id: str) -> int:
        """Estimate current stock level based on recent sales and time since last restock"""
        try:
            # Simulate current stock based on recent sales patterns
            recent_sales = df.tail(7)['units_sold'].sum()  # Last week's sales
            days_since_restock = np.random.randint(1, 30)  # Simulate days since last restock
            
            # Assume stock was at target level at last restock
            target_level = recent_sales * 2  # 2 weeks of demand
            current_stock = max(0, target_level - recent_sales + np.random.randint(-20, 20))
            
            return max(0, int(current_stock))
            
        except Exception as e:
            logger.warning(f"Error estimating current stock: {str(e)}")
            return 100  # Default fallback
    
    def _estimate_lead_time(self, df: pd.DataFrame, warehouse_id: str, sku_id: str) -> int:
        """Estimate lead time based on historical patterns"""
        try:
            # Simulate lead time based on demand volatility
            daily_demand = df.groupby('date')['units_sold'].sum()
            cv = daily_demand.std() / daily_demand.mean() if daily_demand.mean() > 0 else 0
            
            # Higher volatility = longer lead time
            if cv > 0.5:
                base_lead_time = 7
            elif cv > 0.3:
                base_lead_time = 5
            else:
                base_lead_time = 3
            
            # Add some randomness
            lead_time = base_lead_time + np.random.randint(-1, 3)
            return max(1, min(14, lead_time))  # Between 1 and 14 days
            
        except Exception as e:
            logger.warning(f"Error estimating lead time: {str(e)}")
            return 5  # Default fallback
    
    def _calculate_safety_stock(self, demand_stats: Dict, lead_time_days: int) -> int:
        """Calculate safety stock using statistical methods"""
        try:
            mean_demand = demand_stats['mean_daily_demand']
            std_demand = demand_stats['std_daily_demand']
            
            # Safety stock = Z * σ * √(lead_time)
            # Using 1.5 as Z-score for ~93% service level
            safety_stock = self.safety_stock_multiplier * std_demand * np.sqrt(lead_time_days)
            
            # Add buffer for high volatility
            cv = demand_stats['coefficient_of_variation']
            if cv > 0.5:
                safety_stock *= 1.2
            elif cv > 0.8:
                safety_stock *= 1.5
            
            # Ensure minimum safety stock
            min_safety_stock = max(mean_demand * 0.5, 5)
            safety_stock = max(safety_stock, min_safety_stock)
            
            return max(1, int(round(safety_stock)))
            
        except Exception as e:
            logger.warning(f"Error calculating safety stock: {str(e)}")
            return 10  # Default fallback
    
    def _calculate_reorder_point(self, demand_stats: Dict, safety_stock: int, lead_time_days: int) -> int:
        """Calculate reorder point"""
        try:
            mean_daily_demand = demand_stats['mean_daily_demand']
            
            # Reorder point = (lead time demand) + safety stock
            lead_time_demand = mean_daily_demand * lead_time_days
            reorder_point = lead_time_demand + safety_stock
            
            return max(1, int(round(reorder_point)))
            
        except Exception as e:
            logger.warning(f"Error calculating reorder point: {str(e)}")
            return 20  # Default fallback
    
    def _calculate_target_stock(self, demand_stats: Dict, safety_stock: int, lead_time_days: int) -> int:
        """Calculate target stock level"""
        try:
            mean_daily_demand = demand_stats['mean_daily_demand']
            
            # Target stock = safety stock + (lead time demand) + buffer
            lead_time_demand = mean_daily_demand * lead_time_days
            buffer_stock = mean_daily_demand * 3  # 3 days buffer
            
            target_stock = safety_stock + lead_time_demand + buffer_stock
            
            return max(1, int(round(target_stock)))
            
        except Exception as e:
            logger.warning(f"Error calculating target stock: {str(e)}")
            return 50  # Default fallback
    
    def _calculate_order_quantity(self, current_stock: int, target_stock: int, demand_stats: Dict) -> int:
        """Calculate recommended order quantity"""
        try:
            # Basic order quantity
            order_qty = target_stock - current_stock
            
            # Apply lot size constraints
            if self.lot_size_multiplier > 1.0:
                order_qty = np.ceil(order_qty / self.lot_size_multiplier) * self.lot_size_multiplier
            
            # Apply min/max constraints
            order_qty = max(self.min_order_qty, min(self.max_order_qty, order_qty))
            
            # Ensure order quantity is positive
            return max(0, int(round(order_qty)))
            
        except Exception as e:
            logger.warning(f"Error calculating order quantity: {str(e)}")
            return 0
    
    def _determine_stock_status(self, current_stock: int, safety_stock: int, reorder_point: int) -> str:
        """Determine current stock status"""
        if current_stock < safety_stock:
            return "urgent"
        elif current_stock < reorder_point:
            return "low"
        elif current_stock > reorder_point * 2:
            return "excess"
        else:
            return "optimal"
    
    def _calculate_stockout_risk(self, current_stock: int, reorder_point: int, demand_stats: Dict) -> float:
        """Calculate probability of stockout before next replenishment"""
        try:
            if current_stock <= 0:
                return 1.0
            
            # Simple heuristic based on current stock vs reorder point
            if current_stock >= reorder_point:
                return 0.05  # Low risk
            elif current_stock >= reorder_point * 0.5:
                return 0.25  # Medium risk
            else:
                return 0.75  # High risk
                
        except Exception as e:
            logger.warning(f"Error calculating stockout risk: {str(e)}")
            return 0.5
    
    def _calculate_excess_inventory_cost(self, current_stock: int, target_stock: int, demand_stats: Dict) -> float:
        """Calculate cost of excess inventory"""
        try:
            excess = max(0, current_stock - target_stock)
            daily_carrying_cost = 0.02  # 2% daily carrying cost (simplified)
            
            # Estimate days to consume excess inventory
            mean_daily_demand = demand_stats['mean_daily_demand']
            if mean_daily_demand > 0:
                days_to_consume = excess / mean_daily_demand
            else:
                days_to_consume = 30  # Default assumption
            
            # Calculate carrying cost
            carrying_cost = excess * daily_carrying_cost * days_to_consume
            
            return round(carrying_cost, 2)
            
        except Exception as e:
            logger.warning(f"Error calculating excess inventory cost: {str(e)}")
            return 0.0
    
    def optimize_all_warehouses(self, sales_data: List[Dict]) -> Dict:
        """Optimize stock for all warehouse-SKU combinations"""
        results = {}
        
        # Group data by warehouse and SKU
        df = pd.DataFrame(sales_data)
        grouped = df.groupby(['warehouse_id', 'sku_id'])
        
        for (warehouse_id, sku_id), group_data in grouped:
            group_list = group_data.to_dict('records')
            result = self.calculate_stock_recommendations(group_list, warehouse_id, sku_id)
            results[f"{warehouse_id}_{sku_id}"] = result
        
        return results
