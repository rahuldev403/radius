"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Target,
  Briefcase,
  Loader2,
  UserPlus,
  UserMinus,
  MessageCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";

type Project = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  max_participants: number | null;
  goals: string | null;
  skills_needed: string | null;
  creator: {
    id: string;
    full_name: string;
    avatar_url: string;
    bio: string;
  };
};

type Participant = {
  id: number;
  user_id: string;
  joined_at: string;
  role: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("community_projects")
        .select(
          `
          *,
          creator:profiles!community_projects_creator_id_fkey (
            id,
            full_name,
            avatar_url,
            bio
          )
        `
        )
        .eq("id", id)
        .single();

      if (projectError) throw projectError;

      setProject({
        ...projectData,
        creator: Array.isArray(projectData.creator)
          ? projectData.creator[0]
          : projectData.creator,
      } as Project);

      // Fetch participants
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("project_participants")
          .select(
            `
          *,
          user:profiles!project_participants_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
          )
          .eq("project_id", id);

      if (participantsError) throw participantsError;

      const transformedParticipants = (participantsData || []).map((p) => ({
        ...p,
        user: Array.isArray(p.user) ? p.user[0] : p.user,
      })) as Participant[];

      setParticipants(transformedParticipants);

      // Check if current user is a participant
      if (user) {
        const isUserParticipant = transformedParticipants.some(
          (p) => p.user_id === user.id
        );
        setIsParticipant(isUserParticipant);
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProject = async () => {
    if (!currentUser) {
      toast.error("Please login to join projects");
      return;
    }

    if (
      project?.max_participants &&
      participants.length >= project.max_participants
    ) {
      toast.error("Project is full", {
        description: "Maximum participants reached",
      });
      return;
    }

    try {
      setJoining(true);

      const { error } = await supabase.from("project_participants").insert({
        project_id: parseInt(id),
        user_id: currentUser.id,
        role: "member",
      });

      if (error) throw error;

      toast.success("Joined Project!", {
        description: "You are now part of this community project",
      });

      fetchProjectDetails();
    } catch (error: any) {
      toast.error("Failed to join project", {
        description: error.message,
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!currentUser) return;

    try {
      setJoining(true);

      const { error } = await supabase
        .from("project_participants")
        .delete()
        .eq("project_id", parseInt(id))
        .eq("user_id", currentUser.id);

      if (error) throw error;

      toast.success("Left Project", {
        description: "You have left this community project",
      });

      fetchProjectDetails();
    } catch (error: any) {
      toast.error("Failed to leave project", {
        description: error.message,
      });
    } finally {
      setJoining(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Project not found</p>
      </div>
    );
  }

  const isCreator = currentUser?.id === project.creator.id;

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-emerald-50 text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${getStatusColor(project.status)} border`}>
                  {project.status.charAt(0).toUpperCase() +
                    project.status.slice(1)}
                </Badge>
                <Badge variant="outline">{project.category}</Badge>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {project.title}
              </h1>
              <p className="text-gray-600 text-lg">{project.description}</p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {!isCreator && (
                <Button
                  onClick={
                    isParticipant ? handleLeaveProject : handleJoinProject
                  }
                  disabled={joining}
                  className={
                    isParticipant
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  }
                >
                  {joining ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : isParticipant ? (
                    <UserMinus className="w-4 h-4 mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {isParticipant ? "Leave Project" : "Join Project"}
                </Button>
              )}
              {isCreator && (
                <Button
                  variant="outline"
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Manage Project
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {project.goals && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Goals</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {project.goals}
                    </p>
                  </div>
                )}

                {project.skills_needed && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      Skills Needed
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills_needed.split(",").map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-emerald-50 border-emerald-200 text-emerald-700"
                        >
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.start_date && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Start Date
                        </p>
                        <p className="text-sm text-blue-700">
                          {format(new Date(project.start_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.end_date && (
                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          End Date
                        </p>
                        <p className="text-sm text-purple-700">
                          {format(new Date(project.end_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Participants Count */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participants</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {participants.length}
                      {project.max_participants &&
                        ` / ${project.max_participants}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator */}
            <Card>
              <CardHeader>
                <CardTitle>Project Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-emerald-100">
                    <AvatarImage src={project.creator.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl font-bold">
                      {getInitials(project.creator.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {project.creator.full_name}
                    </h3>
                    {project.creator.bio && (
                      <p className="text-sm text-gray-600 mt-1">
                        {project.creator.bio}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Creator
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Participants ({participants.length})
                </CardTitle>
                <CardDescription>
                  People who joined this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No participants yet</p>
                    <p className="text-xs mt-1">
                      Be the first to join this project!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={participant.user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700">
                            {getInitials(participant.user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {participant.user.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {participant.role === "creator"
                              ? "Creator"
                              : "Member"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {isParticipant && (
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">
                    You're a Member!
                  </CardTitle>
                  <CardDescription className="text-emerald-700">
                    Stay connected with the team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Open Discussion
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
