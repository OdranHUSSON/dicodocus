'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Progress,
  Badge,
  Spinner,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';

const Dashboard = () => {
  const [summary, setSummary] = useState<{
    posts: number;
    docs: number;
    pages: number;
    translations: {
      docs: { translated: number; untranslated: number };
      blog: { translated: number; untranslated: number };
      pages: { translated: number; untranslated: number };
    };
  } | null>(null);
  const [docusaurusStatus, setDocusaurusStatus] = useState<{
    local: string;
    production: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const summaryResponse = await fetch('/api/summary');
        if (!summaryResponse.ok) throw new Error('Failed to fetch summary');
        const summaryData = await summaryResponse.json();

        const docusaurusResponse = await fetch('/api/docusaurus-status');
        if (!docusaurusResponse.ok)
          throw new Error('Failed to fetch Docusaurus status');
        const docusaurusData = await docusaurusResponse.json();

        setSummary(summaryData);
        setDocusaurusStatus(docusaurusData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={8} bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.400" />
      </Box>
    );
  }

  if (!summary || !docusaurusStatus) {
    return (
      <Box p={8} bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xl" color="red.500">
          Failed to load data. Please try again.
        </Text>
      </Box>
    );
  }

  const globalTranslated =
    summary.translations.docs.translated +
    summary.translations.blog.translated +
    summary.translations.pages.translated;

  const globalUntranslated =
    summary.translations.docs.untranslated +
    summary.translations.blog.untranslated +
    summary.translations.pages.untranslated;

  const globalTotal = globalTranslated + globalUntranslated;
  const globalProgress = globalTotal > 0 ? (globalTranslated / globalTotal) * 100 : 0;

  const renderProgressBar = (title: string, translations: { translated: number; untranslated: number }) => {
    const total = translations.translated + translations.untranslated;
    const progress = total > 0 ? (translations.translated / total) * 100 : 0;

    return (
      <VStack align="stretch" spacing={2} w="full">
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {Math.round(progress)}%
          </Text>
        </HStack>
        <Progress value={progress} colorScheme="blue" size="sm" />
      </VStack>
    );
  };

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      <VStack spacing={8} align="stretch" maxW="900px" mx="auto">
        {/* Header */}
        <HStack justify="space-between" w="full">
          <Text fontSize="3xl" fontWeight="bold" color="gray.800">
            Dashboard
          </Text>
          <Button
            leftIcon={<LinkIcon />}
            colorScheme="blue"
            variant="solid"
            size="md"
            onClick={() => (window.location.href = '/editor')}
          >
            Open Editor
          </Button>
        </HStack>

        {/* Stats Section */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <VStack
            bg="white"
            borderRadius="lg"
            shadow="sm"
            p={6}
            align="center"
            spacing={3}
          >
            <Text fontSize="lg" color="gray.600">
              Total Posts
            </Text>
            <Text fontSize="4xl" fontWeight="bold" color="gray.900">
              {summary.posts}
            </Text>
          </VStack>

          <VStack
            bg="white"
            borderRadius="lg"
            shadow="sm"
            p={6}
            align="center"
            spacing={3}
          >
            <Text fontSize="lg" color="gray.600">
              Total Docs
            </Text>
            <Text fontSize="4xl" fontWeight="bold" color="gray.900">
              {summary.docs}
            </Text>
          </VStack>

          <VStack
            bg="white"
            borderRadius="lg"
            shadow="sm"
            p={6}
            align="center"
            spacing={3}
          >
            <Text fontSize="lg" color="gray.600">
              Total Pages
            </Text>
            <Text fontSize="4xl" fontWeight="bold" color="gray.900">
              {summary.pages}
            </Text>
          </VStack>
        </SimpleGrid>

        {/* Unified Translation Card */}
        <VStack
          bg="white"
          borderRadius="lg"
          shadow="sm"
          p={6}
          align="center"
          spacing={6}
          w="full"
        >
          <Text fontSize="lg" color="gray.600">
            Global Translation Progress
          </Text>
          <CircularProgress
            value={globalProgress}
            size="120px"
            thickness="10px"
            color="green.400"
          >
            <CircularProgressLabel fontSize="lg" fontWeight="bold">
              {Math.round(globalProgress)}%
            </CircularProgressLabel>
          </CircularProgress>
          <Text fontSize="sm" color="gray.500">
            {globalTranslated} Translated / {globalUntranslated} Untranslated
          </Text>
          <Divider />
          <VStack w="full" spacing={4}>
            {renderProgressBar('Docs Translation', summary.translations.docs)}
            {renderProgressBar('Blog Translation', summary.translations.blog)}
            {renderProgressBar('Pages Translation', summary.translations.pages)}
          </VStack>
        </VStack>

        {/* Docusaurus Status */}
        <VStack
          bg="white"
          borderRadius="lg"
          shadow="sm"
          p={6}
          align="stretch"
          spacing={6}
        >
          <Text fontSize="lg" color="gray.600">
            Docusaurus Status
          </Text>
          <HStack justify="space-between">
            <VStack align="start">
              <Text fontSize="md" fontWeight="bold" color="gray.700">
                Local
              </Text>
              <Badge colorScheme={docusaurusStatus.local === 'running' ? 'green' : 'red'}>
                {docusaurusStatus.local}
              </Badge>
            </VStack>
            <VStack align="start">
              <Text fontSize="md" fontWeight="bold" color="gray.700">
                Production
              </Text>
              <Badge colorScheme={docusaurusStatus.production === 'running' ? 'green' : 'red'}>
                {docusaurusStatus.production}
              </Badge>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default Dashboard;
