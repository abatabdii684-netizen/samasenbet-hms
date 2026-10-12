import React from 'react';

const VARIANTS = {
  success: 'badge-green',
  danger:  'badge-red',
  warning: 'badge-yellow',
  info:    'badge-blue',
  default: 'badge-gray',
  primary: 'badge bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
};

function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {children}
    </span>
  );
}

// Status badge helper
export function StatusBadge({ status }) {
  const map = {
    ACTIVE:      { label: 'Active',       variant: 'success' },
    INACTIVE:    { label: 'Inactive',     variant: 'default' },
    PENDING:     { label: 'Pending',      variant: 'warning' },
    COMPLETED:   { label: 'Completed',    variant: 'success' },
    CANCELLED:   { label: 'Cancelled',    variant: 'danger'  },
    IN_PROGRESS: { label: 'In Progress',  variant: 'info'    },
    APPROVED:    { label: 'Approved',     variant: 'success' },
    REJECTED:    { label: 'Rejected',     variant: 'danger'  },
    WAITING:     { label: 'Waiting',      variant: 'warning' },
    PAID:        { label: 'Paid',         variant: 'success' },
    DRAFT:       { label: 'Draft',        variant: 'default' },
    AVAILABLE:   { label: 'Available',    variant: 'success' },
    OCCUPIED:    { label: 'Occupied',     variant: 'danger'  },
    MAINTENANCE: { label: 'Maintenance',  variant: 'warning' },
    DISCHARGED:  { label: 'Discharged',   variant: 'default' },
    SCHEDULED:   { label: 'Scheduled',    variant: 'info'    },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default Badge;
