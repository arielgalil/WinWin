import { useState, useEffect } from 'react';
import { ClassRoom, UserProfile, Campaign } from '../types';
import { supabase } from '../supabaseClient';
import { useErrorFormatter } from '../utils/errorUtils';
import { useToast } from './useToast';

export const useUsersManager = (currentCampaign?: Campaign | null) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    
    const { addError, clearErrors } = useErrorFormatter();
    const toast = useToast();

    const fetchUsers = async () => {
        if (!currentCampaign?.id) return;
        
        try {
            setLoading(true);
            clearErrors();
            
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('campaign_id', currentCampaign.id)
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            addError('fetchUsers', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const saveUserChanges = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update(editFormData)
                .eq('id', userId);

            if (error) throw error;
            
            toast.success('User updated successfully');
            setEditingUserId(null);
            setEditFormData({});
            await fetchUsers();
        } catch (err) {
            addError('saveUser', err);
            toast.error('Failed to update user');
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            
            toast.success('User deleted successfully');
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            await fetchUsers();
        } catch (err) {
            addError('deleteUser', err);
            toast.error('Failed to delete user');
        }
    };

    const handleDeleteUser = (user: UserProfile) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentCampaign?.id]);

    return {
        users,
        loading,
        editingUserId,
        editFormData,
        isDeleteModalOpen,
        userToDelete,
        setEditingUserId,
        setEditFormData,
        setIsDeleteModalOpen,
        setUserToDelete,
        fetchUsers,
        saveUserChanges,
        handleDeleteUser,
        confirmDelete
    };
};