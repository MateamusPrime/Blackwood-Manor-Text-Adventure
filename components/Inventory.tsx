'use client';

import { Item } from '../engine/types';

interface InventoryProps {
  inventory: string[];
  items: Record<string, Item>;
}

export default function Inventory({ inventory, items }: InventoryProps) {
  return (
    <div
      className="p-2 shrink-0"
      style={{
        fontFamily: "'VT323', monospace",
        color: '#00ff41',
        fontSize: '0.9rem',
      }}
    >
      {/* Frame top */}
      <div style={{ color: '#1a5c1a', lineHeight: 1 }}>
        {'╔' + '═'.repeat(20) + '╗'}
      </div>

      {/* Title row */}
      <div
        style={{
          color: '#ffb000',
          textShadow: '0 0 4px rgba(255,176,0,0.4)',
          lineHeight: 1.4,
          paddingLeft: '4px',
          borderLeft: '1px solid #1a5c1a',
          borderRight: '1px solid #1a5c1a',
        }}
      >
        {'║'} INVENTORY {''.padEnd(10)}{'║'}
      </div>

      {/* Divider */}
      <div style={{ color: '#1a5c1a', lineHeight: 1 }}>
        {'╠' + '═'.repeat(20) + '╣'}
      </div>

      {/* Items */}
      {inventory.length === 0 ? (
        <div
          style={{
            color: '#1a5c1a',
            lineHeight: 1.4,
            borderLeft: '1px solid #1a5c1a',
            borderRight: '1px solid #1a5c1a',
            paddingLeft: '4px',
          }}
        >
          {'║'} {'(empty)'.padEnd(19)}{'║'}
        </div>
      ) : (
        inventory.map((id) => {
          const item = items[id];
          const name = item ? item.name : id;
          const truncated = name.length > 18 ? name.slice(0, 17) + '…' : name;
          return (
            <div
              key={id}
              style={{
                color: '#00ff41',
                lineHeight: 1.4,
                borderLeft: '1px solid #1a5c1a',
                borderRight: '1px solid #1a5c1a',
                paddingLeft: '4px',
                fontSize: '0.82rem',
              }}
            >
              {'║'} {('· ' + truncated).padEnd(19)}{'║'}
            </div>
          );
        })
      )}

      {/* Frame bottom */}
      <div style={{ color: '#1a5c1a', lineHeight: 1 }}>
        {'╚' + '═'.repeat(20) + '╝'}
      </div>
    </div>
  );
}
