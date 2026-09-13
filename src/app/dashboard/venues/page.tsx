'use client';

import { useState } from 'react';
import { MapPin, X, Building2, Phone, User, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenueFormData {
  name: string;
  address: string;
  numberOfCourts: number;
  courtSurface: 'Wood' | 'Synthetic' | 'Carpet' | '';
  contactPerson: string;
  phone: string;
}

const PLACEHOLDER_VENUES = [
  {
    name: 'Flying Feathers Sports Hall',
    address: '12 Badminton Lane, London, EC1A 1BB',
    courts: 6,
    surface: 'Synthetic',
    contact: 'James Okonkwo',
    phone: '+44 7700 900123',
  },
  {
    name: 'Featherstone Leisure Centre',
    address: '45 Leisure Road, London, SE1 7PB',
    courts: 4,
    surface: 'Wood',
    contact: 'Sarah Mitchell',
    phone: '+44 7700 900456',
  },
  {
    name: 'East End Badminton Club',
    address: '78 Court Street, London, E3 2AB',
    courts: 3,
    surface: 'Carpet',
    contact: 'Priya Sharma',
    phone: '+44 7700 900789',
  },
];

function VenueCard({ venue }: { venue: typeof PLACEHOLDER_VENUES[0] }) {
  const surfaceColor: Record<string, string> = {
    Wood: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Synthetic: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    Carpet: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-semibold">{venue.name}</h3>
          <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
            <MapPin size={11} /> {venue.address}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${surfaceColor[venue.surface] ?? 'bg-slate-700 text-slate-300'}`}>
          {venue.surface}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Layers size={13} className="text-slate-500" />
          <span>{venue.courts} courts</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <User size={13} className="text-slate-500" />
          <span>{venue.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 col-span-2">
          <Phone size={13} className="text-slate-500" />
          <span>{venue.phone}</span>
        </div>
      </div>
    </div>
  );
}

function AddVenueModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<VenueFormData>({
    name: '',
    address: '',
    numberOfCourts: 2,
    courtSurface: '',
    contactPerson: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">Add Venue</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-3xl">🏗️</div>
            <p className="text-white font-semibold">Coming Soon</p>
            <p className="text-slate-400 text-sm">
              Venue management is coming soon — your entries will be saved in a future update.
            </p>
            <Button onClick={onClose} className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-white border-0">
              Got it
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Venue Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g., Flying Feathers Sports Hall"
                className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
                className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Number of Courts</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.numberOfCourts}
                  onChange={e => setForm({ ...form, numberOfCourts: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Court Surface</label>
                <select
                  value={form.courtSurface}
                  onChange={e => setForm({ ...form, courtSurface: e.target.value as VenueFormData['courtSurface'] })}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Select surface</option>
                  <option value="Wood">Wood</option>
                  <option value="Synthetic">Synthetic</option>
                  <option value="Carpet">Carpet</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Contact Person</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Name of venue manager"
                className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+44 7700 000000"
                className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white border-0">
                Save Venue
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {showModal && <AddVenueModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin size={22} className="text-cyan-400" />
            Venues
          </h1>
          <p className="text-slate-400 mt-1">Manage badminton venues and courts</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 flex-shrink-0"
        >
          + Add Venue
        </Button>
      </div>

      {/* Coming soon notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🏗️</div>
        <div>
          <p className="text-amber-400 font-semibold">Venue Management — Coming Soon</p>
          <p className="text-slate-400 text-sm mt-1">
            Full venue management with booking and court scheduling is in development.
            The venues below are example placeholders. Click &ldquo;Add Venue&rdquo; to preview the form.
          </p>
        </div>
      </div>

      {/* Form skeleton (disabled) */}
      <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
        <h2 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-slate-500" />
          Venue Form Preview <span className="text-xs text-slate-500 font-normal">(read-only)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 pointer-events-none select-none">
          {[
            { label: 'Venue Name', placeholder: 'Flying Feathers Sports Hall' },
            { label: 'Address', placeholder: '12 Badminton Lane, London' },
            { label: 'Number of Courts', placeholder: '6' },
            { label: 'Court Surface', placeholder: 'Wood / Synthetic / Carpet' },
            { label: 'Contact Person', placeholder: 'James Okonkwo' },
            { label: 'Phone', placeholder: '+44 7700 900000' },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
              <input
                type="text"
                disabled
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-slate-500 text-sm placeholder:text-slate-600 cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder venue cards */}
      <div>
        <h2 className="text-slate-300 font-semibold mb-4">Example Venues</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLACEHOLDER_VENUES.map((venue, i) => (
            <VenueCard key={i} venue={venue} />
          ))}
        </div>
      </div>
    </div>
  );
}
