"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, UserRound } from "lucide-react";
import { getMembers, updateMemberTitle } from "@/lib/api";
import type { Member, MemberTitle } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MEMBER_TITLES: MemberTitle[] = [
  "Designer",
  "Project Manager",
  "Engineer",
  "QA Engineer",
  "Product Manager",
  "DevOps Engineer",
];

type MemberFilter = "all" | MemberTitle;
const UNASSIGNED_VALUE = "__unassigned__";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MembersPageContent() {
  const currentUser = useUser();
  const isAdmin = currentUser.role === "admin";

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const selectedFilter =
          isAdmin && memberFilter !== "all" ? memberFilter : undefined;
        const loadedMembers = await getMembers(selectedFilter);
        setMembers(loadedMembers);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load members";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [isAdmin, memberFilter]);

  const handleRoleUpdate = async (
    memberId: string,
    nextMemberTitleValue: string
  ) => {
    const nextMemberTitle =
      nextMemberTitleValue === UNASSIGNED_VALUE
        ? ""
        : (nextMemberTitleValue as MemberTitle);

    const previousMembers = members;
    setSavingMemberId(memberId);
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId ? { ...member, memberTitle: nextMemberTitle } : member
      )
    );

    try {
      const updated = await updateMemberTitle(memberId, nextMemberTitle);
      setMembers((current) =>
        current.map((member) => (member.id === memberId ? updated : member))
      );
      setError(null);
    } catch (err) {
      setMembers(previousMembers);
      const message =
        err instanceof Error ? err.message : "Failed to update member title";
      setError(message);
    } finally {
      setSavingMemberId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "View all members, filter by title, and assign titles."
              : "View all members in your workspace."}
          </p>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by title</span>
            <Select
              value={memberFilter}
              onValueChange={(value) => setMemberFilter(value as MemberFilter)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All titles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All titles</SelectItem>
                {MEMBER_TITLES.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading members...
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {members.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No members found.
              </CardContent>
            </Card>
          ) : (
            members.map((member) => {
              const isSavingThisMember = savingMemberId === member.id;
              return (
                <Card key={member.id}>
                  <CardHeader className="gap-3 border-b">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">
                            {member.name}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {member.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                        {member.role === "admin" ? (
                          <>
                            <Shield className="size-3.5" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserRound className="size-3.5" />
                            Member
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 pt-4">
                    <CardDescription>Member title</CardDescription>
                    {isAdmin ? (
                      <Select
                        value={member.memberTitle || UNASSIGNED_VALUE}
                        onValueChange={(value) => void handleRoleUpdate(member.id, value)}
                        disabled={isSavingThisMember}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                          {MEMBER_TITLES.map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-foreground">
                        {member.memberTitle || "Unassigned"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
