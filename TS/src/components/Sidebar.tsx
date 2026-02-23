import React from 'react';

interface Props {
  metadata: Record<string, string | number | undefined> | null;
}

const Sidebar: React.FC<Props> = ({ metadata }) => {
  return (
    <aside className="sidebar">
      <h3>DICOM Metadata</h3>
      {metadata ? (
        <ul>
          {Object.entries(metadata).map(([k, v]) => (
            <li key={k}>
              <strong>{k}:</strong> {String(v)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No volume loaded.</p>
      )}
    </aside>
  );
};

export default Sidebar;
