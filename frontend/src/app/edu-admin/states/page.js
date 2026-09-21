'use client';

import React, { useState } from 'react';
import TaxonomyManager from '@/components/admin/TaxonomyManager';
import { Landmark, X, FileText } from 'lucide-react';

export default function StatesAdminPage() {
  const [selectedStateData, setSelectedStateData] = useState(null);

  return (
    <>
      <TaxonomyManager
        title="States"
        singularTitle="State"
        apiEndpoint="/api/v1/states"
        initialFormData={{
          state_number: '',
          governor: '',
          chief_minister: '',
          capital: '',
          land_area: '',
          population: '',
          about_state: '',
        }}
        showSeo={false}
        columns={[
          {
            header: 'State Data',
            render: (item) => (
              <button
                type="button"
                onClick={() => setSelectedStateData(item)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#2271b1] border border-blue-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Landmark size={12} />
                <span>View Data</span>
              </button>
            ),
          },
        ]}
        customFields={({ formData, handleChange }) => (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark size={13} className="text-[#2271b1]" />
              <span>Administrative & State Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  State Number
                </label>
                <input
                  type="text"
                  value={formData.state_number || ''}
                  onChange={(e) => handleChange('state_number', e.target.value)}
                  placeholder="e.g. 05"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Capital
                </label>
                <input
                  type="text"
                  value={formData.capital || ''}
                  onChange={(e) => handleChange('capital', e.target.value)}
                  placeholder="e.g. Dehradun"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Governor
                </label>
                <input
                  type="text"
                  value={formData.governor || ''}
                  onChange={(e) => handleChange('governor', e.target.value)}
                  placeholder="Governor Name"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chief Minister
                </label>
                <input
                  type="text"
                  value={formData.chief_minister || ''}
                  onChange={(e) => handleChange('chief_minister', e.target.value)}
                  placeholder="Chief Minister Name"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Land Area
                </label>
                <input
                  type="text"
                  value={formData.land_area || ''}
                  onChange={(e) => handleChange('land_area', e.target.value)}
                  placeholder="e.g. 53,483 km²"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Population
                </label>
                <input
                  type="text"
                  value={formData.population || ''}
                  onChange={(e) => handleChange('population', e.target.value)}
                  placeholder="e.g. 10.1 Million"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                About State
              </label>
              <textarea
                rows={2}
                value={formData.about_state || ''}
                onChange={(e) => handleChange('about_state', e.target.value)}
                placeholder="Key information, history, and facts about this state..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden resize-none"
              />
            </div>
          </div>
        )}
      />

      {/* State Data Preview Modal */}
      {selectedStateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-[#2271b1]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedStateData.name} — State Data
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStateData(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Capital</span>
                  <span className="font-semibold text-slate-800">{selectedStateData.capital || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">State Number</span>
                  <span className="font-semibold text-slate-800">{selectedStateData.state_number || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Chief Minister</span>
                  <span className="font-semibold text-slate-800">{selectedStateData.chief_minister || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Governor</span>
                  <span className="font-semibold text-slate-800">{selectedStateData.governor || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Land Area</span>
                  <span className="font-semibold text-slate-800">{selectedStateData.land_area || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Population</span>
                  <span className="font-semibold text-slate-800">{selectedStateData.population || '—'}</span>
                </div>
              </div>

              {selectedStateData.about_state && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">About {selectedStateData.name}:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                    {selectedStateData.about_state}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStateData(null)}
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
