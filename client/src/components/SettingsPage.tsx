import React, { useState, useEffect } from 'react';

import { getRulesByUser, deleteRuleForUserById } from '../services/api';
import { useCurrentUser } from '../services';
import { Rule } from '../util/types';
import RuleForm from './RuleForm';
import Banner from './Banner';

const SettingsPage = () => {
  const { userState } = useCurrentUser();
  const [rules, setRules] = useState<Rule[]>([]);

  const refreshRules = () =>
    getRulesByUser(userState.currentUser.id).then(response => {
      setRules(response.data);
    });

  useEffect(() => {
    refreshRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (id: number) => {
    deleteRuleForUserById(userState.currentUser.id, id).then(response => {
      if (response.data.status === 'ok') {
        setRules(rules.filter(rule => rule.id !== id));
      }
    });
  };

  // Add a new state variable to hold the rule being edited
  const [editingRule, setEditingRule] = useState<Partial<Rule>>({});

  // Add a new handler for the Edit button
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setShowRule(true);
    setExpandedRowId(rule.id);
  };

  const onSubmit = (rule: Partial<Rule>) => {
    console.log(rule);
    refreshRules();
    setEditingRule({});
    setShowRule(false);
    setExpandedRowId(null);
  };

  const onCancel = () => {
    console.log('cancel');
    setEditingRule({});
    setShowRule(false);
    setExpandedRowId(null);
  };

  const [showRule, setShowRule] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const onAddNewRuleClick = () => {
    setShowRule(true);
    setExpandedRowId(null);
    setEditingRule({});
  };

  return (
    <div>
      <div>
        <Banner />
      </div>
      <button className={'add-account-button'} onClick={onAddNewRuleClick}>
        Add New Rule
      </button>
      {showRule && expandedRowId === null && (
        <RuleForm
          initialRule={editingRule}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
      <table className="custom-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th className="mobile-only">From</th>
            <th />
            <th>New Name</th>
            <th>New Category</th>
            <th>New Subcategory</th>
            <th className="mobile-only">To</th>
            <th>Serial</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule, index) => (
            <>
              <tr key={rule.id}>
                <td>{index + 1}</td>

                <td>{rule.name}</td>
                <td>{rule.category}</td>
                <td>{rule.subcategory}</td>
                <td className="mobile-only">
                  <tr>
                    <strong>{rule.name}</strong>
                  </tr>
                  <tr>
                    Category:
                    {rule.category || '-'}
                  </tr>
                  <tr>
                    Subcategory:
                    {rule.subcategory || '-'}
                  </tr>
                </td>
                <td>{'=>'}</td>
                <td>{rule.new_name}</td>
                <td>{rule.new_category}</td>
                <td>{rule.new_subcategory}</td>
                <td className="mobile-only">
                  <tr>
                    <strong>{rule.new_name}</strong>
                  </tr>
                  <tr>{rule.new_category}</tr>
                  <tr>{rule.new_subcategory}</tr>
                </td>
                <td>{rule.serial}</td>
                <td>
                  <button
                    className={`rule-table-button`}
                    onClick={() => handleEdit(rule)}
                  >
                    Edit
                  </button>
                  <br />
                  <button
                    className={'rule-table-button'}
                    onClick={() => handleDelete(rule.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>

              {showRule && expandedRowId === rule.id && (
                <tr>
                  <td colSpan={10}>
                    <RuleForm
                      initialRule={editingRule}
                      onSubmit={onSubmit}
                      onCancel={onCancel}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SettingsPage;
