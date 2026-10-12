/**
 * MetroX 3D — Metro network data access & fare engine (Netlify Database)
 */

import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { metroLines, stations, lineStations, stationConnections, trains, schedules, fareRules } from '../db/schema.js';

export interface Station {
  station_id: number;
  station_name: string;
  station_code: string;
  latitude: number;
  longitude: number;
  status: string;
  is_interchange: boolean;
}

export interface MetroLine {
  line_id: number;
  line_name: string;
  line_code: string;
  line_color: string;
  status: string;
}

export interface LineStation {
  line_id: number;
  station_id: number;
  sequence_no: number;
  distance_from_previous_km: number;
}

export interface StationConnection {
  connection_id: number;
  from_station_id: number;
  to_station_id: number;
  travel_minutes: number;
  distance_km: number;
  line_id: number;
}

export interface FareRule {
  base_fare: number;
  per_stop_rate: number;
  per_km_rate: number;
}

export interface Network {
  lines: MetroLine[];
  stations: Station[];
  lineStations: LineStation[];
  connections: StationConnection[];
  fareRule: FareRule;
}

export const stationColumns = {
  station_id: stations.stationId,
  station_name: stations.stationName,
  station_code: stations.stationCode,
  latitude: stations.latitude,
  longitude: stations.longitude,
  status: stations.status,
  is_interchange: stations.isInterchange,
};

export const lineColumns = {
  line_id: metroLines.lineId,
  line_name: metroLines.lineName,
  line_code: metroLines.lineCode,
  line_color: metroLines.lineColor,
  status: metroLines.status,
};

export async function loadNetwork(): Promise<Network> {
  const [lines, stationRows, lineStationRows, connections, rules] = await Promise.all([
    db.select(lineColumns).from(metroLines).orderBy(asc(metroLines.lineId)),
    db.select(stationColumns).from(stations).orderBy(asc(stations.stationId)),
    db
      .select({
        line_id: lineStations.lineId,
        station_id: lineStations.stationId,
        sequence_no: lineStations.sequenceNo,
        distance_from_previous_km: lineStations.distanceFromPreviousKm,
      })
      .from(lineStations)
      .orderBy(asc(lineStations.lineId), asc(lineStations.sequenceNo)),
    db
      .select({
        connection_id: stationConnections.connectionId,
        from_station_id: stationConnections.fromStationId,
        to_station_id: stationConnections.toStationId,
        travel_minutes: stationConnections.travelMinutes,
        distance_km: stationConnections.distanceKm,
        line_id: stationConnections.lineId,
      })
      .from(stationConnections)
      .orderBy(asc(stationConnections.connectionId)),
    db
      .select({ base_fare: fareRules.baseFare, per_stop_rate: fareRules.perStopRate, per_km_rate: fareRules.perKmRate })
      .from(fareRules)
      .where(eq(fareRules.status, 'active'))
      .orderBy(desc(fareRules.effectiveFrom))
      .limit(1),
  ]);

  return {
    lines,
    stations: stationRows,
    lineStations: lineStationRows,
    connections,
    fareRule: rules[0] || { base_fare: 10, per_stop_rate: 2.5, per_km_rate: 3 },
  };
}

export function linesForStation(network: Network, stationId: number): MetroLine[] {
  const lineIds = network.lineStations.filter((ls) => ls.station_id === stationId).map((ls) => ls.line_id);
  return network.lines.filter((l) => lineIds.includes(l.line_id));
}

export async function loadSchedules() {
  return db
    .select({
      schedule_id: schedules.scheduleId,
      train_id: schedules.trainId,
      train_code: trains.trainCode,
      line_id: trains.lineId,
      capacity: trains.capacity,
      departure_time: schedules.departureTime,
      direction: schedules.direction,
      operating_start_date: schedules.operatingStartDate,
      operating_end_date: schedules.operatingEndDate,
      status: schedules.status,
      line_name: metroLines.lineName,
      line_color: metroLines.lineColor,
    })
    .from(schedules)
    .innerJoin(trains, eq(schedules.trainId, trains.trainId))
    .innerJoin(metroLines, eq(trains.lineId, metroLines.lineId))
    .orderBy(asc(schedules.departureTime));
}

// Port of stored procedure sp_calculate_fare
export function calculateFare(
  network: Network,
  sourceId: number,
  destId: number,
  passengerCount: number,
  method: 'stop_based' | 'distance_based' = 'stop_based'
) {
  const rule = network.fareRule;

  let stops = 0;
  let commonLine: number | null = null;
  const srcLines = network.lineStations.filter((ls) => ls.station_id === sourceId);
  const dstLines = network.lineStations.filter((ls) => ls.station_id === destId);
  for (const s of srcLines) {
    const d = dstLines.find((x) => x.line_id === s.line_id);
    if (d) {
      commonLine = s.line_id;
      stops = Math.abs(s.sequence_no - d.sequence_no);
      break;
    }
  }

  if (!commonLine || stops === 0) {
    // Estimated transfer stops
    stops = 4;
  }

  let unitFare = rule.base_fare;
  if (method === 'distance_based') {
    unitFare = rule.base_fare + stops * 1.9 * rule.per_km_rate;
  } else if (stops > 3) {
    unitFare = rule.base_fare + Math.ceil((stops - 3) / 2) * 5.0;
  }

  unitFare = Math.round(unitFare * 100) / 100;
  const totalFare = Math.round(unitFare * passengerCount * 100) / 100;

  return { fare_per_passenger: unitFare, total_fare: totalFare, stops, pricing_method: method };
}
