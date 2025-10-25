"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { wsClient } from "@/lib/websocket-client";
import { toast } from "sonner";
import { X, Loader2, Users, Edit2, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

type Project = {
  id: number;
  title: string;
  description: string;
  creator_id: string;
  status: string;
  required_skills: string[];
  created_at: string;
};

type Participant = {
  id: string;
  full_name: string;
  avatar_url: string;
  joined_at: string;
  role?: string;
};

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onProjectUpdated?: () => void;
}

export function ProjectManagementModal({
  isOpen,
  onClose,
  projectId,
  onProjectUpdated,
}: ProjectManagementModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectData();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    // Connect WebSocket for real-time participant updates
    wsClient.connect(currentUserId);

    // Listen for participant changes
    const handleParticipantUpdate = (data: any) => {
      if (
        data.type === "participant_joined" ||
        data.type === "participant_left"
      ) {
        if (data.projectId === projectId) {
          loadParticipants();
        }
      }
    };

    wsClient.on("participant_joined", handleParticipantUpdate);
    wsClient.on("participant_left", handleParticipantUpdate);

    return () => {
      wsClient.off("participant_joined", handleParticipantUpdate);
      wsClient.off("participant_left", handleParticipantUpdate);
    };
  }, [isOpen, currentUserId, projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in");
        onClose();
        return;
      }
      setCurrentUserId(user.id);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("community_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Check if user is the creator
      if (projectData.creator_id !== user.id) {
        toast.error("Only project creators can manage the project");
        onClose();
        return;
      }

      setProject(projectData);
      setTitle(projectData.title);
      setDescription(projectData.description);
      setStatus(projectData.status);
      setRequiredSkills(projectData.required_skills?.join(", ") || "");

      // Load participants
      await loadParticipants();
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("project_participants")
        .select(
          `
          user_id,
          joined_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("project_id", projectId);

      if (error) throw error;

      const participantsList = data.map((p: any) => ({
        id: p.user_id,
        full_name: p.profiles.full_name,
        avatar_url: p.profiles.avatar_url,
        joined_at: p.joined_at,
      }));

      setParticipants(participantsList);
    } catch (error: any) {
      console.error("Error loading participants:", error);
    }
  };

  const handleSaveChanges = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("community_projects")
        .update({
          title: title.trim(),
          description: description.trim(),
          status: status || "active",
          required_skills: skillsArray,
        })
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Project updated successfully");
      onProjectUpdated?.();

      // Broadcast update to all participants
      wsClient.send({
        type: "project_updated",
        projectId: projectId,
        data: {
          title,
          description,
          status,
          required_skills: skillsArray,
        },
      });

      onClose();
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from("project_participants")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", participantId);

      if (error) throw error;

      toast.success("Participant removed");
      loadParticipants();

      // Broadcast participant removal
      wsClient.send({
        type: "participant_left",
        projectId: projectId,
        userId: participantId,
      });
    } catch (error: any) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant");
    }
  };

  const handleDeleteProject = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("community_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Project deleted");
      onProjectUpdated?.();
      onClose();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Manage Project</DialogTitle>
              <DialogDescription>
                Update project details and manage participants
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <Tabs
            defaultValue="details"
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="participants">
                Participants ({participants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="flex-1 overflow-y-auto space-y-4 mt-4"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter project title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project"
                    rows={5}
                  />
                </div>

                <div>
                  <Label htmlFor="skills">
                    Required Skills (comma-separated)
                  </Label>
                  <Input
                    id="skills"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    placeholder="React, Node.js, Design, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    title="Project Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDeleteProject}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="participants"
              className="flex-1 overflow-y-auto space-y-3 mt-4"
            >
              {participants.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No participants yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <Card key={participant.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={participant.avatar_url} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {getInitials(participant.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {participant.full_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Joined{" "}
                              {new Date(
                                participant.joined_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveParticipant(participant.id)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
