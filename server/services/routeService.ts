/**
 * MetroX 3D — Graph-Based Route Planning Engine
 * Implements Dijkstra's and Breadth-First-Search (BFS) pathfinding across multimodal metro networks.
 */

import { Network, Station, MetroLine, calculateFare } from '../network.js';

export interface RouteSegment {
  fromStation: Station;
  toStation: Station;
  line: MetroLine;
  travelMinutes: number;
  distanceKm: number;
}

export interface RouteOption {
  routeId: string;
  routeName: string;
  optimizationType: 'fastest' | 'least_transfers' | 'fewest_stops';
  sourceStation: Station;
  destinationStation: Station;
  totalStops: number;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  transferCount: number;
  interchangeStations: Station[];
  linesUsed: MetroLine[];
  pathStations: Station[];
  segments: RouteSegment[];
  farePerPassenger: number;
  totalFare: number;
  passengerCount: number;
}

interface GraphNode {
  stationId: number;
  edges: Array<{
    neighborId: number;
    minutes: number;
    distance: number;
    lineId: number;
  }>;
}

export class RoutePlanningService {
  private buildGraph(network: Network): Map<number, GraphNode> {
    const graph = new Map<number, GraphNode>();

    for (const station of network.stations) {
      if (station.status !== 'inactive') {
        graph.set(station.station_id, {
          stationId: station.station_id,
          edges: [],
        });
      }
    }

    for (const conn of network.connections) {
      const node = graph.get(conn.from_station_id);
      if (node && graph.has(conn.to_station_id)) {
        node.edges.push({
          neighborId: conn.to_station_id,
          minutes: conn.travel_minutes,
          distance: conn.distance_km,
          lineId: conn.line_id,
        });
      }
    }

    return graph;
  }

  /**
   * Search routes between source and destination stations
   */
  public searchRoutes(
    network: Network,
    sourceStationId: number,
    destStationId: number,
    passengerCount: number = 1,
    travelDate: string = new Date().toISOString().split('T')[0]
  ): RouteOption[] {
    if (sourceStationId === destStationId) {
      throw new Error('Source and destination stations cannot be the same');
    }

    const source = network.stations.find((s) => s.station_id === sourceStationId);
    const dest = network.stations.find((s) => s.station_id === destStationId);

    if (!source || !dest) {
      throw new Error('Selected station not found in metro network');
    }

    const graph = this.buildGraph(network);

    // 1. Find optimal path by Minimum Travel Time (Dijkstra)
    const fastestPath = this.dijkstra(graph, sourceStationId, destStationId, 'time');

    // 2. Find optimal path by Fewest Stops (BFS)
    const fewestStopsPath = this.bfs(graph, sourceStationId, destStationId);

    // 3. Find optimal path by Minimum Transfers
    const leastTransfersPath = this.dijkstra(graph, sourceStationId, destStationId, 'transfers');

    const rawPaths = [
      { path: fastestPath, type: 'fastest' as const, label: 'Fastest Transit (Direct/Optimal Travel Time)' },
      { path: leastTransfersPath, type: 'least_transfers' as const, label: 'Easiest Route (Minimum Line Transfers)' },
      { path: fewestStopsPath, type: 'fewest_stops' as const, label: 'Direct Corridor (Fewest Station Stops)' },
    ];

    const results: RouteOption[] = [];
    const seenSignatures = new Set<string>();

    for (const { path, type, label } of rawPaths) {
      if (!path || path.length < 2) continue;

      const signature = path.join('-');
      if (seenSignatures.has(signature) && results.length > 0) continue;
      seenSignatures.add(signature);

      const routeOption = this.constructRouteOption(network, path, type, label, source, dest, passengerCount);
      results.push(routeOption);
    }

    return results;
  }

  private constructRouteOption(
    network: Network,
    stationIds: number[],
    optType: 'fastest' | 'least_transfers' | 'fewest_stops',
    label: string,
    source: Station,
    dest: Station,
    passengerCount: number
  ): RouteOption {
    const pathStations: Station[] = stationIds.map((id) => network.stations.find((s) => s.station_id === id)!);
    const segments: RouteSegment[] = [];
    let totalMinutes = 0;
    let totalKm = 0;
    const linesUsedSet = new Set<number>();
    const interchanges: Station[] = [];

    let currentLineId: number | null = null;

    for (let i = 0; i < stationIds.length - 1; i++) {
      const fromId = stationIds[i];
      const toId = stationIds[i + 1];

      // Find connection
      const conn = network.connections.find(
        (c) => c.from_station_id === fromId && c.to_station_id === toId
      ) || {
        travel_minutes: 3,
        distance_km: 1.8,
        line_id: 1,
      };

      const fromSt = network.stations.find((s) => s.station_id === fromId)!;
      const toSt = network.stations.find((s) => s.station_id === toId)!;
      const line = network.lines.find((l) => l.line_id === conn.line_id)!;

      linesUsedSet.add(conn.line_id);

      if (currentLineId !== null && currentLineId !== conn.line_id) {
        interchanges.push(fromSt);
        totalMinutes += 4; // Transfer buffer time (4 min)
      }
      currentLineId = conn.line_id;

      totalMinutes += conn.travel_minutes;
      totalKm += Number(conn.distance_km);

      segments.push({
        fromStation: fromSt,
        toStation: toSt,
        line,
        travelMinutes: conn.travel_minutes,
        distanceKm: Number(conn.distance_km),
      });
    }

    const linesUsed: MetroLine[] = Array.from(linesUsedSet).map(
      (id) => network.lines.find((l) => l.line_id === id)!
    );

    const totalStops = stationIds.length - 1;
    const fareCalc = calculateFare(network, source.station_id, dest.station_id, passengerCount, 'stop_based');

    return {
      routeId: `RT-${source.station_code}-${dest.station_code}-${optType}`,
      routeName: `${source.station_name} to ${dest.station_name} (${label})`,
      optimizationType: optType,
      sourceStation: source,
      destinationStation: dest,
      totalStops,
      totalDurationMinutes: totalMinutes,
      totalDistanceKm: Math.round(totalKm * 10) / 10,
      transferCount: interchanges.length,
      interchangeStations: interchanges,
      linesUsed,
      pathStations,
      segments,
      farePerPassenger: fareCalc.fare_per_passenger,
      totalFare: fareCalc.total_fare,
      passengerCount,
    };
  }

  private dijkstra(
    graph: Map<number, GraphNode>,
    startId: number,
    targetId: number,
    costMode: 'time' | 'transfers'
  ): number[] | null {
    const distances = new Map<number, number>();
    const previous = new Map<number, { node: number; lineId?: number }>();
    const unvisited = new Set<number>();

    for (const [id] of graph) {
      distances.set(id, Infinity);
      unvisited.add(id);
    }
    distances.set(startId, 0);

    const currentLineMap = new Map<number, number>();

    while (unvisited.size > 0) {
      let currentId: number | null = null;
      let minDistance = Infinity;

      for (const id of unvisited) {
        const d = distances.get(id)!;
        if (d < minDistance) {
          minDistance = d;
          currentId = id;
        }
      }

      if (currentId === null || minDistance === Infinity) break;
      if (currentId === targetId) break;

      unvisited.delete(currentId);
      const node = graph.get(currentId);
      if (!node) continue;

      const curLine = currentLineMap.get(currentId);

      for (const edge of node.edges) {
        if (!unvisited.has(edge.neighborId)) continue;

        let edgeCost = edge.minutes;
        if (costMode === 'transfers') {
          // Transfer penalty
          const isTransfer = curLine && curLine !== edge.lineId;
          edgeCost = (isTransfer ? 30 : 1) + edge.minutes * 0.1;
        }

        const newDist = distances.get(currentId)! + edgeCost;
        if (newDist < distances.get(edge.neighborId)!) {
          distances.set(edge.neighborId, newDist);
          previous.set(edge.neighborId, { node: currentId, lineId: edge.lineId });
          currentLineMap.set(edge.neighborId, edge.lineId);
        }
      }
    }

    if (!previous.has(targetId) && startId !== targetId) return null;

    const path: number[] = [targetId];
    let curr = targetId;
    while (curr !== startId) {
      const prev = previous.get(curr);
      if (!prev) return null;
      curr = prev.node;
      path.unshift(curr);
    }
    return path;
  }

  private bfs(graph: Map<number, GraphNode>, startId: number, targetId: number): number[] | null {
    const queue: number[][] = [[startId]];
    const visited = new Set<number>([startId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const curr = path[path.length - 1];

      if (curr === targetId) {
        return path;
      }

      const node = graph.get(curr);
      if (!node) continue;

      for (const edge of node.edges) {
        if (!visited.has(edge.neighborId)) {
          visited.add(edge.neighborId);
          queue.push([...path, edge.neighborId]);
        }
      }
    }

    return null;
  }
}

export const routeService = new RoutePlanningService();
