
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface UserTableProps {
  users: User[];
  title: string;
  className?: string;
}

export function UserTable({ users, title, className }: UserTableProps) {
  return (
    <div className={cn("rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm", className)}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-medium text-sm text-slate-900 dark:text-white">{title} <span className="ml-2 text-xs text-slate-500 font-normal">({users.length} records)</span></h3>
      </div>
      <div className="max-h-[300px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Slack ID</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>
                    <Badge variant={
                      user.status === "completed" ? "default" : 
                      user.status === "processed" ? "secondary" : "outline"
                    } className={
                      user.status === "completed" ? "bg-green-500 hover:bg-green-600" : ""
                    }>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{user.slackId || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{user.email || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
