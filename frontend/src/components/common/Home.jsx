import React from 'react'
import { Link } from 'react-router-dom'
import { UsersIcon, NetworkIcon, LightningIcon, ChartIcon, StarIcon, TrophyIcon, ExternalLinkIcon } from './Icons'

const Home = () => {
  const features = [
    {
      title: 'Pair Chemistry',
      description: 'Calculate offensive and defensive chemistry between any two players using advanced statistical analysis',
      icon: UsersIcon,
      path: '/pair-chemistry',
      color: 'bg-blue-500',
    },
    {
      title: 'Team Network',
      description: 'Visualize chemistry connections for an 11-player lineup on an interactive soccer pitch',
      icon: NetworkIcon,
      path: '/team-network',
      color: 'bg-green-500',
    },
    {
      title: 'Squad Optimizer',
      description: 'Automatically select the optimal starting XI from a squad pool using AI-powered algorithms',
      icon: LightningIcon,
      path: '/optimizer',
      color: 'bg-purple-500',
    },
  ]

  const stats = [
    { value: '713K+', label: 'Players', icon: UsersIcon, color: 'text-blue-600' },
    { value: '36K+', label: 'Teams', icon: TrophyIcon, color: 'text-green-600' },
    { value: '1.9K+', label: 'Competitions', icon: StarIcon, color: 'text-purple-600' },
    { value: '16K+', label: 'Seasons', icon: ChartIcon, color: 'text-orange-600' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="gradient-text">Soccer Chemistry</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
          Discover how well soccer players work together using cutting-edge statistical analysis 
          and contextual factors. Based on the research paper "Player Chemistry: Striving for 
          a Perfectly Balanced Soccer Team" by Bransen & Van Haaren.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/pair-chemistry"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <UsersIcon className="w-5 h-5" />
            <span>Get Started</span>
          </Link>
          <a
            href="https://arxiv.org/abs/2003.01712"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center space-x-2"
          >
            <ExternalLinkIcon className="w-5 h-5" />
            <span>Read Paper</span>
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <Link
              key={index}
              to={feature.path}
              className="feature-card group"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-300 mb-4">
                {feature.description}
              </p>
              <div className="flex items-center text-slate-400 font-medium group-hover:text-white">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Stats Section */}
      <div className="card mb-16">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Dataset Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-300">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Explore?
        </h2>
        <p className="text-slate-300 mb-8">
          Start analyzing player chemistry and optimize your team's performance
        </p>
        <Link
          to="/pair-chemistry"
          className="btn-primary inline-flex items-center space-x-2"
        >
          <UsersIcon className="w-5 h-5" />
          <span>Start Analysis</span>
        </Link>
      </div>
    </div>
  )
}

export default Home