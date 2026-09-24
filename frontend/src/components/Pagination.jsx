import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { current_page, total_pages, total_records, limit } = pagination;

  const startRecord = (current_page - 1) * limit + 1;
  const endRecord = Math.min(current_page * limit, total_records);

  return (
    <div className="pagination">
      <div>
        Showing {startRecord.toLocaleString()} - {endRecord.toLocaleString()} of {total_records.toLocaleString()} logs
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          Previous
        </button>
        <span style={{ padding: '6px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '4px' }}>
          Page {current_page} of {total_pages}
        </span>
        <button
          className="btn btn-secondary"
          disabled={current_page >= total_pages}
          onClick={() => onPageChange(current_page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
