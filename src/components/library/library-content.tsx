'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Grid, List, Filter, MoreVertical, Eye, Edit, Download, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Mock data for now - replace with real data from Supabase
const mockStories = [
  {
    id: '1',
    title: 'Emma\'s Magical Adventure',
    theme: 'bedtime',
    status: 'ready',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    cover_image: '/api/placeholder/300/400',
    page_count: 20,
  },
  {
    id: '2',
    title: 'Family Beach Day',
    theme: 'family-adventures',
    status: 'generating',
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:35:00Z',
    cover_image: '/api/placeholder/300/400',
    page_count: 12,
  },
  {
    id: '3',
    title: 'Birthday Surprise',
    theme: 'celebrations',
    status: 'draft',
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:20:00Z',
    cover_image: null,
    page_count: 0,
  },
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  generating: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const themeLabels = {
  bedtime: 'Bedtime',
  'family-adventures': 'Family Adventures',
  celebrations: 'Celebrations',
  travel: 'Travel',
  'visiting-places': 'Visiting Places',
  custom: 'Custom',
};

export function LibraryContent() {
  const { user } = useUser();
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Load stories
  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with real Supabase query
        // const { data } = await DatabaseService.getUserStories(userId);
        setTimeout(() => {
          setStories(mockStories);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load stories:', error);
        setStories([]);
        setIsLoading(false);
      }
    };

    if (user) {
      loadStories();
    }
  }, [user]);

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || story.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action: string, storyId: string) => {
    switch (action) {
      case 'view':
        // Navigate to viewer
        window.open(`/book/${storyId}/viewer`, '_blank');
        break;
      case 'edit':
        // Navigate to editor
        window.open(`/book/${storyId}/edit`, '_blank');
        break;
      case 'download':
        // Trigger download
        console.log('Download story:', storyId);
        break;
      case 'delete':
        // Show delete confirmation
        if (window.confirm('Are you sure you want to delete this story?')) {
          setStories(prev => prev.filter(s => s.id !== storyId));
        }
        break;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Stories</h1>
          <p className="text-muted-foreground">
            Manage your created stories and continue editing drafts
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <Plus className="h-4 w-4 mr-2" />
            Create New Story
          </Link>
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {selectedStatus === 'all' ? 'All Status' : selectedStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('ready')}>
                Ready
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('generating')}>
                Generating
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('draft')}>
                Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stories */}
      {filteredStories.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-8 w-8 text-muted-foreground" />}
          title={searchQuery ? 'No stories found' : 'No stories yet'}
          description={
            searchQuery 
              ? 'Try adjusting your search or filters'
              : 'Start creating your first personalized picture book'
          }
          action={
            searchQuery 
              ? undefined 
              : {
                  label: 'Create Your First Story',
                  onClick: () => window.location.href = '/create'
                }
          }
        />
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredStories.map((story) => (
            <Card 
              key={story.id} 
              className="group hover:shadow-lg transition-all duration-200"
            >
              <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-6'}>
                {viewMode === 'grid' ? (
                  <div className="space-y-4">
                    {/* Cover image */}
                    <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                      {story.cover_image ? (
                        <Image 
                          src={story.cover_image} 
                          alt={story.title}
                          width={200}
                          height={280}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Plus className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Story info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold truncate">{story.title}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {themeLabels[story.theme as keyof typeof themeLabels]}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[story.status as keyof typeof statusColors]}`}>
                          {story.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {story.page_count} pages • Created {new Date(story.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('view', story.id)}
                        disabled={story.status !== 'ready'}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleAction('edit', story.id)}
                            disabled={story.status === 'generating'}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction('download', story.id)}
                            disabled={story.status !== 'ready'}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction('delete', story.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Cover thumbnail */}
                    <div className="w-16 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {story.cover_image ? (
                        <Image 
                          src={story.cover_image} 
                          alt={story.title}
                          width={200}
                          height={280}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Story info */}
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{story.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{themeLabels[story.theme as keyof typeof themeLabels]}</span>
                        <span>{story.page_count} pages</span>
                        <span>Created {new Date(story.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[story.status as keyof typeof statusColors]}`}>
                        {story.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('view', story.id)}
                        disabled={story.status !== 'ready'}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleAction('edit', story.id)}
                            disabled={story.status === 'generating'}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction('download', story.id)}
                            disabled={story.status !== 'ready'}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction('delete', story.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}