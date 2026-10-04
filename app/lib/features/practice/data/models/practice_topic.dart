import 'package:flutter/material.dart';

class PracticeTopic {
  final String id;
  final String title;
  final String domain; // "APTITUDE" or "TECHNICAL"
  final String description;
  final IconData icon;
  final Color accentColor;
  final List<String> subtopics;

  const PracticeTopic({
    required this.id,
    required this.title,
    required this.domain,
    required this.description,
    required this.icon,
    required this.accentColor,
    required this.subtopics,
  });

  static const List<PracticeTopic> aptitudeTopics = [
    PracticeTopic(
      id: 'QUANTITATIVE',
      title: 'Quantitative Aptitude',
      domain: 'APTITUDE',
      description: 'Arithmetic, speed & distance, time & work, percentages.',
      icon: Icons.calculate_rounded,
      accentColor: Color(0xFF4F46E5),
      subtopics: ['Time & Work', 'Speed & Distance', 'Percentages', 'Ratios'],
    ),
    PracticeTopic(
      id: 'LOGICAL',
      title: 'Logical Reasoning',
      domain: 'APTITUDE',
      description: 'Number series, syllogisms, blood relations, deductive logic.',
      icon: Icons.psychology_rounded,
      accentColor: Color(0xFF0284C7),
      subtopics: ['Series', 'Syllogisms', 'Deductive Logic', 'Directions'],
    ),
    PracticeTopic(
      id: 'VERBAL',
      title: 'Verbal Ability',
      domain: 'APTITUDE',
      description: 'Vocabulary, antonyms, grammar, reading comprehension.',
      icon: Icons.menu_book_rounded,
      accentColor: Color(0xFF10B981),
      subtopics: ['Antonyms & Synonyms', 'Sentence Correction', 'Comprehension'],
    ),
    PracticeTopic(
      id: 'DATA_INTERPRETATION',
      title: 'Data Interpretation',
      domain: 'APTITUDE',
      description: 'Table charts, bar graphs, growth analysis, data sufficiency.',
      icon: Icons.pie_chart_rounded,
      accentColor: Color(0xFFF59E0B),
      subtopics: ['Table Charts', 'Bar Graphs', 'Growth Trends'],
    ),
  ];

  static const List<PracticeTopic> technicalTopics = [
    PracticeTopic(
      id: 'DSA',
      title: 'Data Structures & Algorithms',
      domain: 'TECHNICAL',
      description: 'Arrays, linked lists, trees, graphs, sorting, searching.',
      icon: Icons.account_tree_rounded,
      accentColor: Color(0xFF6366F1),
      subtopics: ['Arrays & Hash Maps', 'Trees & Graphs', 'Binary Search'],
    ),
    PracticeTopic(
      id: 'DBMS',
      title: 'Database Management',
      domain: 'TECHNICAL',
      description: 'ACID properties, indexing, normalization, SQL queries.',
      icon: Icons.storage_rounded,
      accentColor: Color(0xFF0D9488),
      subtopics: ['ACID & Transactions', 'Indexing', 'SQL & Joins'],
    ),
    PracticeTopic(
      id: 'OS',
      title: 'Operating Systems',
      domain: 'TECHNICAL',
      description: 'Processes, threads, deadlock conditions, virtual memory.',
      icon: Icons.memory_rounded,
      accentColor: Color(0xFF8B5CF6),
      subtopics: ['Process Scheduling', 'Deadlocks', 'Paging & Memory'],
    ),
    PracticeTopic(
      id: 'NETWORKS',
      title: 'Computer Networks',
      domain: 'TECHNICAL',
      description: 'TCP/IP, OSI model, routing protocols, DNS, HTTP/S.',
      icon: Icons.hub_rounded,
      accentColor: Color(0xFFEC4899),
      subtopics: ['TCP vs UDP', 'OSI Layers', 'Routing & DNS'],
    ),
    PracticeTopic(
      id: 'OOP',
      title: 'OOP & System Design',
      domain: 'TECHNICAL',
      description: 'Polymorphism, SOLID principles, design patterns.',
      icon: Icons.layers_rounded,
      accentColor: Color(0xFFEA580C),
      subtopics: ['Inheritance & Polymorphism', 'SOLID Principles'],
    ),
  ];

  static List<PracticeTopic> get allTopics => [...aptitudeTopics, ...technicalTopics];
}
