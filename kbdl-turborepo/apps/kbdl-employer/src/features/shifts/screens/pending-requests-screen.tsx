'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/components/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useApproveShift, useGetPendingRequests, useRejectShift } from '../hooks/use-shift-hook';

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const PendingRequestsScreen = ({
  shiftId,
  onClose,
}: {
  shiftId: string | null;
  onClose: () => void;
}) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (shiftId) {
      setPage(1);
    }
  }, [shiftId]);

  const {
    data: response,
    isLoading,
    error,
  } = useGetPendingRequests(shiftId ? { shift_id: shiftId, limit, page } : undefined);

  const { mutate: approveShift, isPending: isApproving } = useApproveShift();
  const { mutate: rejectShift, isPending: isRejecting } = useRejectShift();

  const handleApprove = (applicationId: string) => {
    approveShift(applicationId, {
      onSuccess: () => {
        toast.success('Shift approved successfully');
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to approve shift');
      },
    });
  };

  const handleReject = (applicationId: string) => {
    rejectShift(applicationId, {
      onSuccess: () => {
        toast.success('Shift rejected successfully');
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to reject shift');
      },
    });
  };

  const pendingApplications = response?.data || [];
  const meta = response?.meta;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <Dialog open={!!shiftId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pending Requests</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-destructive">
            {error.message || 'Failed to load requests'}
          </div>
        ) : pendingApplications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No pending requests found.
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applied At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <p className="font-medium">{app.user?.name || 'Unknown Worker'}</p>
                      <p className="text-xs text-muted-foreground">{app.user?.phone_no}</p>
                    </TableCell>
                    <TableCell className="capitalize">{app.type}</TableCell>
                    <TableCell>{formatDate(String(app.created_at))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleReject(app.id)}
                          disabled={isRejecting || isApproving}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={() => handleApprove(app.id)}
                          disabled={isApproving || isRejecting}
                        >
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-muted-foreground">
                <span>Total: {meta.total as number} requests</span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange((meta.page as number) - 1)}
                        className={
                          (meta.page as number) <= 1
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-4 font-medium text-foreground">
                        Page {meta.page as number} of {meta.totalPages as number}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange((meta.page as number) + 1)}
                        className={
                          (meta.page as number) >= (meta.totalPages as number)
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
