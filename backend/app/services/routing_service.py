import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime, timedelta
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math
from app.core.config import settings

logger = logging.getLogger(__name__)


class RouteOptimizationService:
    def __init__(self):
        self.vehicle_capacity = 1000  # Default vehicle capacity
        self.max_route_time = 480  # Maximum route time in minutes (8 hours)
        self.average_speed = 50  # Average speed in mph
        self.service_time_per_stop = 15  # Service time per stop in minutes
        
    def optimize_routes(self, warehouse_data: Dict, delivery_points: List[Dict], 
                       vehicle_constraints: Optional[Dict] = None) -> Dict:
        """Optimize delivery routes using OR-Tools VRP solver"""
        try:
            if not delivery_points:
                return {
                    "status": "error",
                    "error": "No delivery points provided"
                }
            
            # Apply vehicle constraints if provided
            if vehicle_constraints:
                self.vehicle_capacity = vehicle_constraints.get('capacity', self.vehicle_capacity)
                self.max_route_time = vehicle_constraints.get('max_time', self.max_route_time)
                self.average_speed = vehicle_constraints.get('speed', self.average_speed)
            
            # Create distance matrix
            locations = [warehouse_data] + delivery_points
            distance_matrix = self._create_distance_matrix(locations)
            
            # Create demand array
            demands = [0] + [point.get('demand_qty', 0) for point in delivery_points]
            
            # Solve VRP
            solution = self._solve_vrp(distance_matrix, demands, len(delivery_points))
            
            if solution['status'] == 'success':
                # Build route details
                routes = self._build_route_details(
                    solution['routes'], warehouse_data, delivery_points, distance_matrix
                )
                
                return {
                    "status": "success",
                    "warehouse_id": warehouse_data.get('warehouse_id'),
                    "total_routes": len(routes),
                    "total_distance": sum(route['total_distance'] for route in routes),
                    "total_time": sum(route['estimated_time'] for route in routes),
                    "total_cost": sum(route['estimated_cost'] for route in routes),
                    "efficiency_score": self._calculate_efficiency_score(routes),
                    "routes": routes,
                    "optimization_metrics": solution.get('metrics', {}),
                    "last_updated": datetime.now().isoformat()
                }
            else:
                return solution
                
        except Exception as e:
            logger.error(f"Error optimizing routes: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _create_distance_matrix(self, locations: List[Dict]) -> List[List[int]]:
        """Create distance matrix between all locations"""
        try:
            n = len(locations)
            matrix = [[0] * n for _ in range(n)]
            
            for i in range(n):
                for j in range(n):
                    if i != j:
                        # Calculate Euclidean distance (can be replaced with real road distances)
                        lat1, lng1 = locations[i]['lat'], locations[i]['lng']
                        lat2, lng2 = locations[j]['lat'], locations[j]['lng']
                        
                        distance = self._calculate_distance(lat1, lng1, lat2, lng2)
                        matrix[i][j] = int(distance)
            
            return matrix
            
        except Exception as e:
            logger.error(f"Error creating distance matrix: {str(e)}")
            raise
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        try:
            # Convert to radians
            lat1_rad = math.radians(lat1)
            lng1_rad = math.radians(lng1)
            lat2_rad = math.radians(lat2)
            lng2_rad = math.radians(lng2)
            
            # Haversine formula
            dlat = lat2_rad - lat1_rad
            dlng = lng2_rad - lng1_rad
            
            a = (math.sin(dlat / 2) ** 2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            
            # Earth's radius in miles
            R = 3959
            
            return R * c
            
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return 0.0
    
    def _solve_vrp(self, distance_matrix: List[List[int]], demands: List[int], 
                   num_deliveries: int) -> Dict:
        """Solve Vehicle Routing Problem using OR-Tools"""
        try:
            # Create routing model
            manager = pywrapcp.RoutingIndexManager(len(distance_matrix), 1, 0)
            routing = pywrapcp.RoutingModel(manager)
            
            # Define distance callback
            def distance_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                return distance_matrix[from_node][to_node]
            
            transit_callback_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
            
            # Add capacity constraint
            routing.AddDimensionWithVehicleCapacity(
                transit_callback_index,
                0,  # null capacity slack
                [self.vehicle_capacity],  # vehicle maximum capacities
                True,  # start cumul to zero
                'Capacity'
            )
            
            # Add time constraint
            routing.AddDimension(
                transit_callback_index,
                0,  # no slack
                self.max_route_time,  # maximum time per vehicle
                False,  # start cumul to zero
                'Time'
            )
            
            # Add demand constraint
            routing.AddDimensionWithVehicleCapacity(
                transit_callback_index,
                0,  # null capacity slack
                [self.vehicle_capacity],  # vehicle maximum capacities
                True,  # start cumul to zero
                'Demand'
            )
            
            # Set demand callback
            def demand_callback(from_index):
                from_node = manager.IndexToNode(from_index)
                return demands[from_node]
            
            demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
            routing.AddDimensionWithVehicleCapacity(
                demand_callback_index,
                0,  # null capacity slack
                [self.vehicle_capacity],  # vehicle maximum capacities
                True,  # start cumul to zero
                'Demand'
            )
            
            # Set search parameters
            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )
            search_parameters.local_search_metaheuristic = (
                routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
            )
            search_parameters.time_limit.seconds = 30  # 30 second time limit
            
            # Solve the problem
            solution = routing.SolveWithParameters(search_parameters)
            
            if solution:
                # Extract routes
                routes = []
                total_distance = 0
                
                for vehicle_id in range(1):
                    route = []
                    index = routing.Start(vehicle_id)
                    route_distance = 0
                    
                    while not routing.IsEnd(index):
                        node_index = manager.IndexToNode(index)
                        route.append(node_index)
                        previous_index = index
                        index = solution.Value(routing.NextVar(index))
                        route_distance += routing.GetArcCostForVehicle(
                            previous_index, index, vehicle_id
                        )
                    
                    # Add end node
                    node_index = manager.IndexToNode(index)
                    route.append(node_index)
                    
                    if len(route) > 1:  # Route has stops
                        routes.append(route)
                        total_distance += route_distance
                
                return {
                    "status": "success",
                    "routes": routes,
                    "total_distance": total_distance,
                    "metrics": {
                        "solver_time": solution.ObjectiveValue(),
                        "num_routes": len(routes)
                    }
                }
            else:
                return {
                    "status": "error",
                    "error": "No solution found"
                }
                
        except Exception as e:
            logger.error(f"Error solving VRP: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def _build_route_details(self, route_indices: List[List[int]], warehouse_data: Dict,
                           delivery_points: List[Dict], distance_matrix: List[List[int]]) -> List[Dict]:
        """Build detailed route information"""
        routes = []
        
        for route_idx, route in enumerate(route_indices):
            if len(route) <= 1:  # Skip empty routes
                continue
            
            # Build stops for this route
            stops = []
            total_distance = 0
            current_time = datetime.now()
            
            for i, node_idx in enumerate(route):
                if node_idx == 0:  # Warehouse
                    stop = {
                        'stop_id': f"WH-{route_idx}",
                        'client_id': warehouse_data.get('warehouse_id', 'WH'),
                        'customer_name': warehouse_data.get('name', 'Warehouse'),
                        'lat': warehouse_data['lat'],
                        'lng': warehouse_data['lng'],
                        'demand_qty': 0,
                        'estimated_arrival': current_time.isoformat(),
                        'order': i,
                        'type': 'warehouse'
                    }
                else:
                    # Delivery point
                    delivery_point = delivery_points[node_idx - 1]
                    stop = {
                        'stop_id': f"STOP-{route_idx}-{i}",
                        'client_id': delivery_point.get('client_id', f'CUST{i}'),
                        'customer_name': delivery_point.get('customer_name', f'Customer {i}'),
                        'lat': delivery_point['lat'],
                        'lng': delivery_point['lng'],
                        'demand_qty': delivery_point.get('demand_qty', 0),
                        'estimated_arrival': current_time.isoformat(),
                        'order': i,
                        'type': 'delivery'
                    }
                
                stops.append(stop)
                
                # Calculate travel time to next stop
                if i < len(route) - 1:
                    next_node_idx = route[i + 1]
                    distance = distance_matrix[node_idx][next_node_idx]
                    total_distance += distance
                    
                    # Calculate travel time (distance / speed)
                    travel_time_minutes = (distance / self.average_speed) * 60
                    current_time += timedelta(minutes=travel_time_minutes)
                    
                    # Add service time
                    current_time += timedelta(minutes=self.service_time_per_stop)
            
            # Calculate route metrics
            estimated_time = (total_distance / self.average_speed) * 60  # minutes
            estimated_cost = total_distance * 2.5  # $2.50 per mile
            efficiency_score = self._calculate_route_efficiency(stops, total_distance)
            
            routes.append({
                'route_id': f"ROUTE-{route_idx + 1}",
                'warehouse_id': warehouse_data.get('warehouse_id', 'WH'),
                'stops': stops,
                'total_distance': round(total_distance, 2),
                'estimated_time': round(estimated_time, 1),
                'estimated_cost': round(estimated_cost, 2),
                'efficiency_score': round(efficiency_score, 1),
                'num_stops': len(stops) - 1,  # Exclude warehouse
                'total_demand': sum(stop['demand_qty'] for stop in stops),
                'utilization': min(100, (sum(stop['demand_qty'] for stop in stops) / self.vehicle_capacity) * 100)
            })
        
        return routes
    
    def _calculate_route_efficiency(self, stops: List[Dict], total_distance: float) -> float:
        """Calculate route efficiency score (0-100)"""
        try:
            if len(stops) <= 1:
                return 0.0
            
            # Base efficiency on distance per stop
            distance_per_stop = total_distance / (len(stops) - 1)  # Exclude warehouse
            
            # Ideal distance per stop (lower is better)
            ideal_distance = 10.0  # 10 miles per stop as ideal
            
            # Calculate efficiency score
            if distance_per_stop <= ideal_distance:
                efficiency = 100.0
            else:
                efficiency = max(0, 100 - ((distance_per_stop - ideal_distance) / ideal_distance) * 50)
            
            # Bonus for good stop distribution
            if len(stops) > 2:
                # Check if stops are well-distributed
                distances = []
                for i in range(1, len(stops) - 1):
                    # Calculate distance between consecutive stops
                    lat1, lng1 = stops[i]['lat'], stops[i]['lng']
                    lat2, lng2 = stops[i + 1]['lat'], stops[i + 1]['lng']
                    dist = self._calculate_distance(lat1, lng1, lat2, lng2)
                    distances.append(dist)
                
                if distances:
                    avg_distance = np.mean(distances)
                    std_distance = np.std(distances)
                    
                    # Bonus for consistent spacing
                    if std_distance < avg_distance * 0.3:
                        efficiency += 10
                    elif std_distance < avg_distance * 0.5:
                        efficiency += 5
            
            return min(100, max(0, efficiency))
            
        except Exception as e:
            logger.warning(f"Error calculating route efficiency: {str(e)}")
            return 50.0  # Default score
    
    def _calculate_efficiency_score(self, routes: List[Dict]) -> float:
        """Calculate overall efficiency score for all routes"""
        try:
            if not routes:
                return 0.0
            
            # Weighted average of individual route efficiencies
            total_score = 0
            total_weight = 0
            
            for route in routes:
                weight = route.get('num_stops', 1)  # Weight by number of stops
                total_score += route.get('efficiency_score', 0) * weight
                total_weight += weight
            
            if total_weight > 0:
                return round(total_score / total_weight, 1)
            else:
                return 0.0
                
        except Exception as e:
            logger.warning(f"Error calculating overall efficiency: {str(e)}")
            return 0.0
    
    def optimize_multiple_warehouses(self, warehouses: List[Dict], 
                                   delivery_points: List[Dict]) -> Dict:
        """Optimize routes for multiple warehouses"""
        results = {}
        
        for warehouse in warehouses:
            # Filter delivery points for this warehouse (simplified - assign randomly)
            # In production, you'd implement proper assignment logic
            warehouse_deliveries = delivery_points.copy()
            
            result = self.optimize_routes(warehouse, warehouse_deliveries)
            results[warehouse.get('warehouse_id', 'unknown')] = result
        
        return results
    
    def get_route_statistics(self, routes: List[Dict]) -> Dict:
        """Calculate comprehensive route statistics"""
        try:
            if not routes:
                return {}
            
            total_distance = sum(route.get('total_distance', 0) for route in routes)
            total_time = sum(route.get('estimated_time', 0) for route in routes)
            total_cost = sum(route.get('estimated_cost', 0) for route in routes)
            total_stops = sum(route.get('num_stops', 0) for route in routes)
            
            # Calculate averages
            avg_distance = total_distance / len(routes) if routes else 0
            avg_time = total_time / len(routes) if routes else 0
            avg_cost = total_cost / len(routes) if routes else 0
            avg_stops = total_stops / len(routes) if routes else 0
            
            # Calculate efficiency distribution
            efficiency_scores = [route.get('efficiency_score', 0) for route in routes]
            efficiency_distribution = {
                'excellent': len([s for s in efficiency_scores if s >= 90]),
                'good': len([s for s in efficiency_scores if 70 <= s < 90]),
                'fair': len([s for s in efficiency_scores if 50 <= s < 70]),
                'poor': len([s for s in efficiency_scores if s < 50])
            }
            
            return {
                'total_routes': len(routes),
                'total_distance': round(total_distance, 2),
                'total_time': round(total_time, 1),
                'total_cost': round(total_cost, 2),
                'total_stops': total_stops,
                'average_distance': round(avg_distance, 2),
                'average_time': round(avg_time, 1),
                'average_cost': round(avg_cost, 2),
                'average_stops': round(avg_stops, 1),
                'efficiency_distribution': efficiency_distribution,
                'overall_efficiency': round(np.mean(efficiency_scores), 1) if efficiency_scores else 0
            }
            
        except Exception as e:
            logger.error(f"Error calculating route statistics: {str(e)}")
            return {}
