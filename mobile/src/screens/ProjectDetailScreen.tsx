/**
 * EcoFix AI - Project Detail Screen
 * =================================
 * This is the core coordination screen for a specific civic project.
 * It displays the AI-generated roadmap, allows users to pledge to micro-tasks,
 * handles project funding, community comments, and project closeout/verification.
 * 
 * Flow:
 * 1. Fetches specific project details, tasks, and comments from the backend.
 * 2. Users can pledge to tasks (XP is awarded on project closeout).
 * 3. Users can vote "Yes" or "No" when an After-Photo is uploaded to verify the cleanup.
 * 4. Includes the Expo Camera for submitting Proof-to-Fix photos.
 * 
 * Connections:
 * - GET `/api/projects/{id}`: Fetch project details.
 * - GET `/api/projects/{id}/tasks`: Fetch roadmap tasks.
 * - GET `/api/projects/{id}/comments`: Fetch community updates.
 * - POST `/api/tasks/{id}/pledge`: Volunteer for a task.
 * - POST `/api/projects/{id}/verify`: Upload the After-Photo.
 * - POST `/api/projects/{id}/verification-vote`: Cast community vote.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';

const API_URL = 'http://192.168.1.9:8000/api';
const CURRENT_USER_ID = 'user-1'; // Mock user Profile ID
const CURRENT_USER_NAME = 'Elena Rostova';

export default function ProjectDetailScreen({ route }: any) {
  const { projectId } = route.params;
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState<string | null>(null);
  const [backingAmount, setBackingAmount] = useState('');
  const [backing, setBacking] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentPhotoUrl, setCommentPhotoUrl] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [photo, setPhoto] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<any>(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const projectResp = await fetch(`${API_URL}/projects/${projectId}`);
      const projectData = await projectResp.json();
      setProject(projectData);

      const tasksResp = await fetch(`${API_URL}/projects/${projectId}/tasks`);
      const tasksData = await tasksResp.json();
      setTasks(tasksData);

      const commentsResp = await fetch(`${API_URL}/projects/${projectId}/comments`);
      const commentsData = await commentsResp.json();
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePledge = async (taskId: string) => {
    try {
      setPledging(taskId);
      const response = await fetch(`${API_URL}/tasks/${taskId}/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: CURRENT_USER_ID,
          volunteer_name: CURRENT_USER_NAME
        })
      });

      if (response.ok) {
        Alert.alert("Task Pledged! 🤝", "Thank you for volunteering! Bring supplies or effort as scheduled.");
        fetchProjectDetails(); // refresh details
      } else {
        Alert.alert("Error", "Could not complete task pledge.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPledging(null);
    }
  };

  const handleBackProject = async () => {
    const amt = parseFloat(backingAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please input a valid positive amount to pledge.");
      return;
    }

    try {
      setBacking(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: CURRENT_USER_ID,
          amount: amt
        })
      });

      if (response.ok) {
        Alert.alert("Contribution Recorded! 💳", `Successfully backed $${amt} for project materials.`);
        setBackingAmount('');
        fetchProjectDetails();
      } else {
        Alert.alert("Error", "Could not process contribution.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBacking(false);
    }
  };

  const handleProofToFix = async () => {
    if (!permission) {
      requestPermission();
      return;
    }
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed to verify the fix.");
      requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const opt = { quality: 0.8, skipProcessing: false, base64: true };
        const data = await cameraRef.current.takePictureAsync(opt);
        setPhoto(data);
        submitFix(data);
      } catch (err) {
        console.error("Failed to take photo: ", err);
      }
    }
  };

  const submitFix = async (photoData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          after_image_url: photoData.uri,
          reporter_id: CURRENT_USER_ID
        })
      });
      if (response.ok) {
        Alert.alert("Submitted for Verification 📸", "The community will now vote to confirm the debris is cleared. 3 positive votes are needed to close the project!");
        fetchProjectDetails();
      } else {
        Alert.alert("Verification Failed", "After image perspective did not match or error occurred.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShowCamera(false);
      setPhoto(null);
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      setUpvoting(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/upvote`, { method: 'POST' });
      if (response.ok) {
        fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleVerificationVote = async (vote: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/verification-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: CURRENT_USER_ID,
          vote: vote
        })
      });
      if (response.ok) {
        fetchProjectDetails();
        Alert.alert("Vote Cast!", "Thank you for helping verify this project.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: CURRENT_USER_ID,
          author_name: CURRENT_USER_NAME,
          content: newComment,
          photo_url: commentPhotoUrl ? commentPhotoUrl : null
        })
      });
      if (response.ok) {
        setNewComment('');
        setCommentPhotoUrl('');
        fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !project) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const fundingProgress = (project.current_funds / project.estimated_cost) * 100;
  const isCompleted = project.status === 'completed';
  const isPending = project.status === 'pending_verification';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Image source={{ uri: isCompleted || isPending ? project.after_image_url : project.before_image_url }} style={styles.image} />
      
      {isCompleted && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedBannerText}>✓ PROJECT CLEANED & VERIFIED</Text>
        </View>
      )}

      {isPending && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingBannerText}>⏳ PENDING COMMUNITY VERIFICATION</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{project.title}</Text>
            {project.address ? <Text style={styles.addressText}>📍 {project.address}</Text> : null}
          </View>
          <TouchableOpacity style={styles.upvoteBtn} onPress={handleUpvote} disabled={upvoting}>
            <Text style={styles.upvoteText}>🔥 {project.upvotes || 0}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{project.description}</Text>

        {/* AI Stats Row */}
        <View style={styles.aiPanel}>
          <Text style={styles.sectionTitle}>AI Verification Summary</Text>
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Volumetric Load</Text>
              <Text style={styles.statValue}>{project.volumetric_debris}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Feasibility Index</Text>
              <Text style={styles.statValue}>{project.feasibility_score}%</Text>
            </View>
          </View>
          <View style={styles.hazardsBox}>
            <Text style={styles.hazardsLabel}>Safety Precautions:</Text>
            <Text style={styles.hazardsValue}>
              {project.safety_flags.length > 0 
                ? project.safety_flags.map((f: string) => f.replace('_', ' ')).join(', ') 
                : 'No hazardous material identified.'
              }
            </Text>
          </View>
        </View>

        {/* Crowdfunding ledger */}
        {!isCompleted && (
          <View style={styles.fundingCard}>
            <Text style={styles.sectionTitle}>Crowdfunding Budget</Text>
            <View style={styles.progressRow}>
              <Text style={styles.fundingDetails}>Raised: ${project.current_funds} / ${project.estimated_cost}</Text>
              <Text style={styles.progressPercent}>{Math.round(fundingProgress)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, fundingProgress)}%` }]} />
            </View>
            
            {fundingProgress < 100 && (
              <View style={styles.backingInputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="$ Amount"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={backingAmount}
                  onChangeText={setBackingAmount}
                />
                <TouchableOpacity style={styles.backButton} onPress={handleBackProject} disabled={backing}>
                  <Text style={styles.backButtonText}>CONTRIBUTE</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Micro-Task Billboard */}
        <View style={styles.billboardContainer}>
          <Text style={styles.sectionTitle}>Micro-Task Billboard ({tasks.length})</Text>
          
          {(isTasksExpanded ? tasks : tasks.slice(0, 2)).map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{task.role_required}</Text>
                </View>
              </View>
              <Text style={styles.taskDesc}>{task.description}</Text>
              
              <View style={styles.taskFooter}>
                {task.status === 'open' ? (
                  <TouchableOpacity 
                    style={styles.pledgeBtn}
                    onPress={() => handlePledge(task.id)}
                    disabled={pledging === task.id || isCompleted}
                  >
                    <Text style={styles.pledgeBtnText}>PLEDGE WORK</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.assigneeText}>
                    {task.status === 'completed' ? '✓ Completed' : `🤝 Pledged by ${task.assigned_name}`}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {tasks.length > 2 && (
            <TouchableOpacity 
              style={styles.viewMoreBtn}
              onPress={() => setIsTasksExpanded(!isTasksExpanded)}
            >
              <Text style={styles.viewMoreText}>
                {isTasksExpanded ? "View Less ▲" : `View ${tasks.length - 2} More ▼`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Community Comments */}
        <View style={styles.commentsContainer}>
          <Text style={styles.sectionTitle}>Community Updates</Text>
          {comments.map((cmd) => (
            <View key={cmd.id} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{cmd.author_name}</Text>
              <Text style={styles.commentText}>{cmd.content}</Text>
              {cmd.photo_url && (
                <Image source={{ uri: cmd.photo_url }} style={styles.commentImage} />
              )}
            </View>
          ))}
          
          <View style={styles.commentInputBox}>
            <TextInput
              style={styles.input}
              placeholder="Post an update or comment..."
              placeholderTextColor="#9ca3af"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Optional: Photo URL (e.g., https://...)"
              placeholderTextColor="#9ca3af"
              value={commentPhotoUrl}
              onChangeText={setCommentPhotoUrl}
            />
            <TouchableOpacity style={styles.postCommentBtn} onPress={handlePostComment}>
              <Text style={styles.postCommentBtnText}>POST</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voting Widget for Pending Verification */}
        {isPending && (
          <View style={styles.votingContainer}>
            <Text style={styles.votingTitle}>Did they actually clean this?</Text>
            <Text style={styles.votingSubtitle}>Review the After-Photo above and cast your vote. 3 YES votes will close this project.</Text>
            <View style={styles.votingStats}>
              <Text style={styles.voteYesText}>✅ YES: {project.verification_votes_yes || 0}/3</Text>
              <Text style={styles.voteNoText}>❌ NO: {project.verification_votes_no || 0}</Text>
            </View>
            <View style={styles.votingButtons}>
              <TouchableOpacity style={styles.voteYesBtn} onPress={() => handleVerificationVote(true)}>
                <Text style={styles.voteBtnText}>YES (Verified)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voteNoBtn} onPress={() => handleVerificationVote(false)}>
                <Text style={styles.voteBtnText}>NO (Still dirty)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Proof-to-Fix Closure Button */}
        {!isCompleted && !isPending && (
          <TouchableOpacity style={styles.closeoutBtn} onPress={handleProofToFix}>
            <Text style={styles.closeoutBtnText}>📸 UPLOAD AFTER-PHOTO (PROVE FIX)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" transparent={false}>
        <View style={styles.modalCameraContainer}>
          <CameraView 
            style={styles.fullCamera} 
            facing="back"
            ref={cameraRef} 
            onCameraReady={() => setIsCameraReady(true)}
          />
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCamera(false)}>
              <X color="#fff" size={28} />
            </TouchableOpacity>
            
            <View style={styles.captureContainer}>
              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 240,
    width: '100%',
  },
  completedBanner: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    alignItems: 'center',
  },
  completedBannerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pendingBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    alignItems: 'center',
  },
  pendingBannerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  body: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  addressText: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  upvoteBtn: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginLeft: 12,
  },
  upvoteText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  description: {
    color: '#9ca3af',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  aiPanel: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hazardsBox: {
    backgroundColor: '#ef444410',
    borderWidth: 0.5,
    borderColor: '#ef444440',
    padding: 10,
    borderRadius: 8,
  },
  hazardsLabel: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hazardsValue: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
  },
  fundingCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fundingDetails: {
    color: '#ffffff',
    fontSize: 13,
  },
  progressPercent: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  backingInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
  },
  backButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  billboardContainer: {
    marginBottom: 20,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandIcon: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewMoreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 4,
  },
  viewMoreText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  taskCard: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: '#10b98120',
    borderWidth: 0.5,
    borderColor: '#10b98150',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  taskFooter: {
    borderTopWidth: 0.5,
    borderTopColor: '#374151',
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  pledgeBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pledgeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  assigneeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  closeoutBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  closeoutBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentsContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  commentCard: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#e5e7eb',
    fontSize: 14,
  },
  commentImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginTop: 8,
  },
  commentInputBox: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 8,
  },
  postCommentBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  postCommentBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  votingContainer: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  votingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  votingSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 16,
  },
  votingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  voteYesText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  voteNoText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteYesBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteNoBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
