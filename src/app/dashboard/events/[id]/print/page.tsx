'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateQRCode } from '@/lib/qr';

export default function EventPrintPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const [event, setEvent] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      // Load event details
      const { data: eventData } = await supabase
        .from('events')
        .select('id, child_name, location, date_start')
        .eq('id', eventId)
        .single();

      if (eventData) setEvent(eventData);

      // Load teams
      const { data: teamsData } = await supabase
        .from('event_teams')
        .select('id, password, route_id')
        .eq('event_id', eventId)
        .order('password');

      if (teamsData) setTeams(teamsData);

      // Load stations for QR codes
      const { data: stationsData } = await supabase
        .from('event_stations')
        .select('id, model_station:model_stations!model_station_id(display_name)')
        .eq('event_id', eventId)
        .order('sequence_order');

      if (stationsData) setStations(stationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-red-600">Event not found</div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="no-print mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Print Materials</h1>
          <p className="text-gray-600">Ready to print team codes and QR codes</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print All
        </button>
      </div>

      {/* Event Info Header */}
      <div className="print-section mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-2">{event.child_name}'s Quest</h2>
        <p className="text-gray-600">Location: {event.location}</p>
        <p className="text-gray-600">Date: {new Date(event.date_start).toLocaleDateString()}</p>
      </div>

      {/* Team Codes */}
      <div className="print-section mb-8">
        <h2 className="text-lg font-bold mb-4">Team Codes</h2>
        <div className="grid grid-cols-2 gap-4">
          {teams.map((team, index) => (
            <div key={team.id} className="p-6 border-2 border-dashed border-gray-300 text-center">
              <div className="text-lg font-medium text-gray-700">Team {index + 1}</div>
              <div className="text-4xl font-mono font-bold text-blue-600 my-2">{team.password}</div>
              <div className="text-sm text-gray-500">Enter this code to start your quest</div>
            </div>
          ))}
        </div>
      </div>

      {/* Station QR Codes */}
      <div className="print-section">
        <h2 className="text-lg font-bold mb-4">Station QR Codes</h2>
        <div className="grid grid-cols-2 gap-6">
          {stations.map((station, index) => {
            const qrUrl = `${window.location.origin}/s/${eventId}/${station.id}`;
            const qrCodeDataUrl = generateQRCode(qrUrl);

            return (
              <div key={station.id} className="p-4 border text-center break-inside-avoid">
                <div className="text-lg font-medium mb-2">
                  Station {index + 1}: {(station.model_station as any)?.display_name}
                </div>
                <div className="flex justify-center mb-2">
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code for Station ${index + 1}`}
                    className="w-32 h-32"
                  />
                </div>
                <div className="text-xs text-gray-500 break-all">
                  {qrUrl}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}