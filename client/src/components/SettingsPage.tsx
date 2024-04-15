import React, { useState, useEffect } from 'react';

import {
  getRulesByUser,
  addRuleForUser,
  updateRuleForUserById,
  deleteRuleForUserById,
} from '../services/api';
import { useCurrentUser } from '../services';
import { Rule } from '../util/types';
import RuleForm from './RuleForm';
import { set } from 'lodash';

const SettingsPage = () => {
  const { userState } = useCurrentUser();
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Partial<Rule>>({});

  const refreshRules = () =>
    getRulesByUser(userState.currentUser.id).then(response => {
      setRules(response.data);
    });

  useEffect(() => {
    refreshRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewRule({ ...newRule, [event.target.name]: event.target.value });
  };

  // Modify the handleFormSubmit handler to also handle updates
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingRule && editingRule.id) {
      // If we're editing an existing rule, call the update API endpoint
      updateRuleForUserById(
        userState.currentUser.id,
        editingRule.id,
        newRule
      ).then(response => {
        if (response.data.status === 'ok') {
          refreshRules();
          setNewRule({});
          setEditingRule({}); // Clear the editing rule
        }
      });
    } else {
      // If we're adding a new rule, call the add API endpoint
      addRuleForUser(userState.currentUser.id, newRule).then(response => {
        if (response.data.status === 'ok') {
          refreshRules();
          setNewRule({});
        }
      });
    }
  };

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

  // Populate the form with the data from the editing rule when it's set
  useEffect(() => {
    setNewRule(editingRule);
  }, [editingRule]);

  const onAddNewRuleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShowRule(true);
    setExpandedRowId(null);
    setEditingRule({});
  };

  return (
    <div>
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
